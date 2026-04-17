'use client';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { GripVertical, Eye, EyeOff } from 'lucide-react';
import { Toggle } from '@/components/ui/Toggle';
import { Button } from '@/components/ui/Button';
import type { MetricConfig } from '@/types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MetricConfigEditorProps {
  metrics: MetricConfig[];
  onSave: (metrics: MetricConfig[]) => void;
  saving?: boolean;
}

function SortableRow({ metric, onToggle }: {
  metric: MetricConfig;
  onToggle: (key: string, field: keyof MetricConfig) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: metric.metric_key });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 px-4 py-3 bg-white border border-[#E5E7EB] rounded-lg',
        isDragging && 'shadow-lg border-[#00BD7D] z-50 opacity-90',
        !metric.is_visible && 'opacity-50'
      )}
    >
      {/* Drag handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-[#D1D5DB] hover:text-[#9CA3AF]">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#111827]">{metric.label}</p>
        <p className="text-[10px] text-[#9CA3AF]">{metric.metric_key} · {metric.unit}</p>
      </div>

      {/* Toggles */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <p className="text-[10px] text-[#9CA3AF] mb-1">Visible</p>
          <Toggle
            size="sm"
            checked={metric.is_visible}
            onChange={() => onToggle(metric.metric_key, 'is_visible')}
          />
        </div>
        <div className="text-center">
          <p className="text-[10px] text-[#9CA3AF] mb-1">KPI Card</p>
          <Toggle
            size="sm"
            checked={metric.show_in_kpi}
            onChange={() => onToggle(metric.metric_key, 'show_in_kpi')}
            disabled={!metric.is_visible}
          />
        </div>
        <div className="text-center">
          <p className="text-[10px] text-[#9CA3AF] mb-1">Table</p>
          <Toggle
            size="sm"
            checked={metric.show_in_table}
            onChange={() => onToggle(metric.metric_key, 'show_in_table')}
            disabled={!metric.is_visible}
          />
        </div>
      </div>
    </div>
  );
}

export function MetricConfigEditor({ metrics: initial, onSave, saving }: MetricConfigEditorProps) {
  const [metrics, setMetrics] = useState<MetricConfig[]>(initial);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMetrics(items => {
        const oldIdx = items.findIndex(m => m.metric_key === active.id);
        const newIdx = items.findIndex(m => m.metric_key === over.id);
        return arrayMove(items, oldIdx, newIdx).map((m, i) => ({ ...m, display_order: i }));
      });
    }
  }

  function handleToggle(key: string, field: keyof MetricConfig) {
    setMetrics(prev => prev.map(m =>
      m.metric_key === key ? { ...m, [field]: !m[field] } : m
    ));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-[#374151]">Drag to reorder. Toggle visibility per column.</p>
          <p className="text-xs text-[#9CA3AF] mt-0.5">Changes apply to the client&apos;s dashboard immediately on save.</p>
        </div>
        <Button onClick={() => onSave(metrics)} loading={saving}>
          Save changes
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={metrics.map(m => m.metric_key)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {metrics.map(metric => (
              <SortableRow key={metric.metric_key} metric={metric} onToggle={handleToggle} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
