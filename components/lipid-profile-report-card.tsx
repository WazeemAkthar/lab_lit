"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface LipidValues {
  totalCholesterol: string
  hdl: string
  triglycerides: string
}

interface LipidProfileReportCardProps {
  onValuesChange: (values: any) => void
}

export function LipidProfileReportCard({ onValuesChange }: LipidProfileReportCardProps) {
  const [values, setValues] = useState<LipidValues>({
    totalCholesterol: "",
    hdl: "",
    triglycerides: "",
  })

  const updateValue = (field: keyof LipidValues, value: string) => {
    const newValues = { ...values, [field]: value }
    setValues(newValues)

    // Calculations
    const total = parseFloat(newValues.totalCholesterol) || 0
    const hdl = parseFloat(newValues.hdl) || 0
    const tg = parseFloat(newValues.triglycerides) || 0

    const vldl = tg > 0 ? tg / 5 : 0
    const ldl = total > 0 ? total - (hdl + vldl) : 0
    const ratio = hdl > 0 ? total / hdl : 0

    const calculatedValues = {
      ...newValues,
      vldl: vldl ? vldl.toFixed(2) : "",
      ldl: ldl ? ldl.toFixed(2) : "",
      tcHdlRatio: ratio ? ratio.toFixed(2) : "",
    }

    onValuesChange(calculatedValues)
  }

  const total = parseFloat(values.totalCholesterol) || 0
  const hdl = parseFloat(values.hdl) || 0
  const tg = parseFloat(values.triglycerides) || 0
  const vldl = tg > 0 ? (tg / 5).toFixed(2) : ""
  const ldl = total > 0 ? (total - (hdl + (tg / 5))).toFixed(2) : ""
  const ratio = hdl > 0 ? (total / hdl).toFixed(2) : ""

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge variant="outline">LIPID</Badge>
          Lipid Profile
        </CardTitle>
        <CardDescription>
          Enter values below. VLDL, LDL, and TC/HDL Ratio will be calculated automatically.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Main Parameters */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Main Parameters</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalCholesterol">Total Cholesterol</Label>
              <Input
                id="totalCholesterol"
                type="number"
                step="0.1"
                value={values.totalCholesterol}
                onChange={(e) => updateValue("totalCholesterol", e.target.value)}
                placeholder="180"
              />
              <div className="text-xs text-muted-foreground">mg/dL (&lt;200)</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hdl">HDL Cholesterol</Label>
              <Input
                id="hdl"
                type="number"
                step="0.1"
                value={values.hdl}
                onChange={(e) => updateValue("hdl", e.target.value)}
                placeholder="45"
              />
              <div className="text-xs text-muted-foreground">mg/dL (&gt;40)</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="triglycerides">Triglycerides</Label>
              <Input
                id="triglycerides"
                type="number"
                step="0.1"
                value={values.triglycerides}
                onChange={(e) => updateValue("triglycerides", e.target.value)}
                placeholder="120"
              />
              <div className="text-xs text-muted-foreground">mg/dL (&lt;150)</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Calculated Parameters */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground">Calculated Parameters</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vldl">VLDL</Label>
              <Input
                id="vldl"
                type="number"
                value={vldl}
                placeholder="Auto-calculated"
                className="bg-muted"
                readOnly
              />
              <div className="text-xs text-muted-foreground">mg/dL (5-40)</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ldl">LDL</Label>
              <Input
                id="ldl"
                type="number"
                value={ldl}
                placeholder="Auto-calculated"
                className="bg-muted"
                readOnly
              />
              <div className="text-xs text-muted-foreground">mg/dL (&lt;130)</div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tcHdlRatio">Total Cholesterol / HDL Ratio</Label>
              <Input
                id="tcHdlRatio"
                type="number"
                value={ratio}
                placeholder="Auto-calculated"
                className="bg-muted"
                readOnly
              />
              <div className="text-xs text-muted-foreground">Ratio (&lt;5.0)</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
