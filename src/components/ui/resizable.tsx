import { GripVertical } from 'lucide-react';
import * as ResizablePrimitive from 'react-resizable-panels';

import { cn } from '@/lib/utils';

const ResizablePanelGroup = ({
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Group>) => (
  <ResizablePrimitive.Group
    className={cn(
      'flex w-full data-[panel-group-direction=vertical]:flex-col',
      className,
    )}
    {...props}
  />
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizableHandle = ({
  withHandle,
  className,
  ...props
}: React.ComponentProps<typeof ResizablePrimitive.Separator> & {
  withHandle?: boolean;
}) => (
  <ResizablePrimitive.Separator
    className={cn(
      'group relative flex w-5 shrink-0 cursor-col-resize items-center justify-center bg-transparent text-border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-5 data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:cursor-row-resize [&[data-panel-group-direction=vertical]>div.handle-knob]:rotate-90',
      className,
    )}
    {...props}
  >
    {!withHandle && (
      <>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 w-3 -translate-x-1/2 rounded-sm bg-transparent transition-colors group-hover:bg-primary/10 group-data-[panel-group-direction=vertical]:inset-x-0 group-data-[panel-group-direction=vertical]:left-0 group-data-[panel-group-direction=vertical]:top-1/2 group-data-[panel-group-direction=vertical]:h-3 group-data-[panel-group-direction=vertical]:w-full group-data-[panel-group-direction=vertical]:-translate-y-1/2 group-data-[panel-group-direction=vertical]:translate-x-0 group-data-[panel-group-direction=vertical]:bg-muted/70"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border transition-colors group-hover:bg-primary group-data-[panel-group-direction=vertical]:inset-x-0 group-data-[panel-group-direction=vertical]:left-0 group-data-[panel-group-direction=vertical]:top-1/2 group-data-[panel-group-direction=vertical]:h-px group-data-[panel-group-direction=vertical]:w-full group-data-[panel-group-direction=vertical]:-translate-y-1/2 group-data-[panel-group-direction=vertical]:translate-x-0"
        />
      </>
    )}
    {withHandle && (
      <div className="handle-knob z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
        <GripVertical className="h-2.5 w-2.5" />
      </div>
    )}
  </ResizablePrimitive.Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
