"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Printer as Print, Edit } from "lucide-react"
import { DataManager, type Report } from "@/lib/data-manager"
import { generateReportPDF } from "@/lib/pdf-generator"
import Link from "next/link"

export default function ReportDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const reportId = params.id as string

  const [report, setReport] = useState<Report | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const authStatus = localStorage.getItem("lablite_auth")
    if (authStatus !== "authenticated") {
      router.push("/")
      return
    }
    setIsAuthenticated(true)

    // Load report data
    const dataManager = DataManager.getInstance()
    const allReports = dataManager.getReports()
    const reportData = allReports.find((rep) => rep.id === reportId)

    if (!reportData) {
      // Report not found, redirect to reports list
      router.push("/reports")
      return
    }

    setReport(reportData)
    setLoading(false)
  }, [reportId])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!report) return
    
    try {
      // Get patient data for the PDF
      const dataManager = DataManager.getInstance()
      const patient = dataManager.getPatientById(report.patientId)
      
      if (!patient) {
        alert("Patient information not found")
        return
      }
      
      // Generate and download PDF
      await generateReportPDF(report, patient)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Error generating PDF. Please try again.")
    }
  }

  const renderTestResults = (results: any[]) => {
    // Group results by test type
    const groupedResults = results.reduce((groups, result) => {
      const testCode = result.testCode
      if (!groups[testCode]) {
        groups[testCode] = []
      }
      groups[testCode].push(result)
      return groups
    }, {} as Record<string, any[]>)

    return (
      <div className="space-y-6">
        {Object.entries(groupedResults).map(([testCode, testResults]) => {
          if (testCode === 'FBC') {
            return renderFBCResults(testResults)
          } else {
            return renderRegularTestResults(testCode, testResults)
          }
        })}
      </div>
    )
  }

  const renderFBCResults = (fbcResults: any[]) => {
    // Categorize the FBC results
    const mainParams = fbcResults.filter(result => 
      ['Hemoglobin', 'RBC', 'PCV', 'MCV', 'MCH', 'MCHC', 'RDW-CV', 'Platelets', 'WBC'].includes(result.testName)
    )
    
    const differentialCount = fbcResults.filter(result => 
      ['Neutrophils', 'Lymphocytes', 'Eosinophils', 'Monocytes', 'Basophils'].includes(result.testName)
    )
    
    const absoluteCount = fbcResults.filter(result => 
      ['Neutrophils (Abs)', 'Lymphocytes (Abs)', 'Eosinophils (Abs)', 'Monocytes (Abs)', 'Basophils (Abs)'].includes(result.testName)
    )

    const renderTable = (results: any[], title?: string) => (
      <div className="mb-6">
        {title && <h4 className="font-medium text-sm text-muted-foreground mb-3">{title}</h4>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-semibold">Parameter</th>
                <th className="text-right py-2 font-semibold">Result</th>
                <th className="text-right py-2 font-semibold">Units</th>
                <th className="text-right py-2 font-semibold">Reference Range</th>
                <th className="text-center py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => {
                const status = checkValueStatus(result.value, result.referenceRange)
                const getStatusDisplay = (status: string) => {
                  if (status === 'low') return { text: 'L', variant: 'destructive' as const }
                  if (status === 'high') return { text: 'H', variant: 'destructive' as const }
                  return { text: '', variant: 'default' as const }
                }
                const statusDisplay = getStatusDisplay(status)
                
                return (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 font-medium">{result.testName}</td>
                    <td className="text-right py-2 font-semibold">{result.value}</td>
                    <td className="text-right py-2 text-muted-foreground">{result.unit}</td>
                    <td className="text-right py-2 text-muted-foreground">{result.referenceRange}</td>
                    <td className="text-center py-2">
                      {statusDisplay.text && (
                        <Badge variant={statusDisplay.variant} className="text-xs font-bold">
                          {statusDisplay.text}
                        </Badge>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )

    return (
      <div key="FBC" className="border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <Badge variant="outline" className="text-lg px-3 py-1">FBC</Badge>
          <span className="font-semibold text-lg">Full Blood Count</span>
        </div>
        
        {mainParams.length > 0 && renderTable(mainParams)}
        {mainParams.length > 0 && differentialCount.length > 0 && <hr className="my-4 border-gray-200" />}
        {differentialCount.length > 0 && renderTable(differentialCount, "Differential Count")}
        {differentialCount.length > 0 && absoluteCount.length > 0 && <hr className="my-4 border-gray-200" />}
        {absoluteCount.length > 0 && renderTable(absoluteCount, "Absolute Count")}
      </div>
    )
  }

  const renderRegularTestResults = (testCode: string, testResults: any[]) => {
    return (
      <div key={testCode}>
        {testResults.map((result, index) => (
          <div key={`${testCode}-${index}`} className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">{result.testCode}</Badge>
              <span className="font-medium">{result.testName}</span>
            </div>

            <div className="grid gap-4 md:grid-cols-3 mb-3">
              <div>
                <span className="text-sm text-muted-foreground">Result:</span>
                <div className="font-semibold text-lg">
                  {result.value} {result.unit}
                </div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Reference Range:</span>
                <div className="font-medium">{result.referenceRange}</div>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Status:</span>
                <div>
                  <Badge variant="secondary">Normal</Badge>
                </div>
              </div>
            </div>

            {result.comments && (
              <div>
                <span className="text-sm text-muted-foreground">Comments:</span>
                <p className="text-sm mt-1">{result.comments}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  const checkValueStatus = (value: string, referenceRange: string) => {
    // Returns 'normal', 'low', or 'high'
    if (!value || !referenceRange) return 'normal'
    
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return 'normal'
    
    // Extract range like "12.0-16.0" or "4.0-11.0"
    const rangeMatch = referenceRange.match(/(\d+\.?\d*)-(\d+\.?\d*)/)
    if (!rangeMatch) return 'normal'
    
    const minValue = parseFloat(rangeMatch[1])
    const maxValue = parseFloat(rangeMatch[2])
    
    if (numValue < minValue) return 'low'
    if (numValue > maxValue) return 'high'
    return 'normal'
  }


  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!report) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Report Not Found</h1>
          <Button asChild>
            <Link href="/reports">Back to Reports</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <style jsx global>{`
        @media print {
          body { font-size: 10px; }
          .no-print { display: none !important; }
          .print-break { page-break-after: always; }
          @page { 
            margin: 0.7in; 
            size: A4;
          }
          table { 
            font-size: 8px;
            border-collapse: collapse;
            width: 100%;
          }
          th, td {
            padding: 2px 4px;
            border: 1px solid #ddd;
          }
          th {
            background-color: #f5f5f5 !important;
            font-weight: bold;
          }
          h1, h2, h3 {
            font-size: 14px;
            margin: 8px 0 4px 0;
          }
          h4 {
            font-size: 10px;
            margin: 6px 0 3px 0;
            background-color: #f5f5f5;
            padding: 2px 4px;
          }
          hr {
            margin: 6px 0;
            border: 0.5px solid #ccc;
          }
          .badge {
            font-size: 6px !important;
            padding: 1px 3px !important;
          }
        }
      `}</style>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 no-print">
          <Button asChild variant="outline" size="icon">
            <Link href="/reports">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Report {report.id}</h1>
            <p className="text-muted-foreground">Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Print className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>

        {/* Report Content */}
        <Card className="print:shadow-none max-w-4xl mx-auto print:max-w-none">
          <CardHeader className="pb-6">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">Azza Medical Laboratory Services</CardTitle>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Unique Place for all Diagnostic needs</div>
                  <div>Phone: 0752537178, 0776452417, 0753274455</div>
                  <div>Email: azzaarafath@gmail.com</div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="default" className="text-lg px-4 py-2">
                  Laboratory Report
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Patient Information */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="font-semibold mb-2">Patient Information:</h3>
                <div className="space-y-1">
                  <div className="font-medium">{report.patientName}</div>
                  <div className="text-sm text-muted-foreground">Patient ID: {report.patientId}</div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Report Details:</h3>
                <div className="space-y-1 text-sm">
                  <div>
                    <span className="text-muted-foreground">Report ID:</span> {report.id}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Invoice ID:</span> {report.invoiceId}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Date:</span>{" "}
                    {new Date(report.createdAt).toLocaleDateString()}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reviewed by:</span> {report.reviewedBy}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Test Results */}
            <div>
              <h3 className="font-semibold mb-4">Test Results:</h3>
              {renderTestResults(report.results)}
            </div>

            {/* Doctor's Remarks */}
            {report.doctorRemarks && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">Doctor's Remarks:</h3>
                  <p className="text-sm">{report.doctorRemarks}</p>
                </div>
              </>
            )}

            <Separator />

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground space-y-2">
              <p>This report has been reviewed and approved by {report.reviewedBy}</p>
              <p>For questions about this report, please contact us at info@lablite.com</p>
              <p className="font-medium">*** End of Report ***</p>
            </div>
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  )
}
