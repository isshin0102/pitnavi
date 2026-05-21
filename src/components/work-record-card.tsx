import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkRecord } from "@/lib/types";
import { SERVICE_CATEGORY_LABELS, CAR_TYPE_LABELS } from "@/lib/types";
import { formatYen } from "@/lib/fee-calculator";
import { Clock, Banknote, Car } from "lucide-react";

interface WorkRecordCardProps {
  record: WorkRecord;
}

export function WorkRecordCard({ record }: WorkRecordCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="secondary" className="text-[10px]">
            {SERVICE_CATEGORY_LABELS[record.category]}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {CAR_TYPE_LABELS[record.car_type]}
          </Badge>
        </div>
        <CardTitle className="text-sm">{record.title}</CardTitle>
        {record.description && (
          <CardDescription className="text-xs line-clamp-3">
            {record.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Banknote className="h-3 w-3" />
            {formatYen(record.labor_cost)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {record.duration_minutes}分
          </span>
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">
          {new Date(record.created_at).toLocaleDateString("ja-JP")}
        </p>
      </CardContent>
    </Card>
  );
}
