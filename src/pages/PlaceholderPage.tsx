import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function PlaceholderPage({ title, stage }: { title: string; stage: number }) {
  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Construction className="h-5 w-5 text-warning" />
              Módulo em Construção
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Este módulo será implementado na Etapa {stage} do plano de desenvolvimento do SIGT.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
