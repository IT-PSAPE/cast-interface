import { useEffect, useMemo, useState } from 'react';
import { FolderPlus } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  defaultDropAnimationSideEffects,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { PlaylistTree } from '@core/types';
import { Button } from '../../components/controls/button';
import { Panel } from '../../components/layout/panel';
import { ScrollArea } from '../../components/layout/scroll-area';
import { useNavigation } from '../../contexts/navigation-context';
import { useLibraryBrowser } from './library-browser-context';
import { useLibraryPanelState } from './library-panel-context';
import { PlaylistSegmentGroup, SEGMENT_CONTAINER_PREFIX, SegmentEntryDragOverlay } from './playlist-segment-group';
import { Label } from '@renderer/components/display/text';
import { Accordion } from '@renderer/components/display/accordion';
import { EmptyState } from '../../components/display/empty-state';

type SegmentList = PlaylistTree['segments'];

const EMPTY_SEGMENTS: SegmentList = [];

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0' } } }),
};

export function SegmentsBrowser() {
  const { createSegment, reorderSegment, movePlaylistEntry } = useNavigation();
  const { libraryPanelView, expandedSegmentIds, setExpandedSegmentIds } = useLibraryPanelState();
  const { state } = useLibraryBrowser();
  const segmentSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const entrySensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [optimisticSegments, setOptimisticSegments] = useState<SegmentList | null>(null);

  const rawSegments = state.selectedTree?.segments ?? EMPTY_SEGMENTS;
  const displayedSegments = optimisticSegments ?? rawSegments;

  const activeEntry = useMemo(() => {
    if (!activeEntryId) return null;
    for (const segment of displayedSegments) {
      const found = segment.entries.find((entry) => entry.entry.id === activeEntryId);
      if (found) return found;
    }
    return null;
  }, [activeEntryId, displayedSegments]);

  // Clear optimistic state when server snapshot catches up. We only reset on
  // rawSegments reference changes so the drop animation retains the optimistic
  // ordering until the backend mutation lands.
  useEffect(() => {
    setOptimisticSegments(null);
  }, [rawSegments]);

  if (libraryPanelView !== 'playlist') return null;
  if (!state.selectedTree) {
    return <EmptyState.Root><EmptyState.Title>Select a playlist</EmptyState.Title></EmptyState.Root>;
  }

  function handleNewSegment() { void createSegment(); }

  function handleSegmentDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const newIndex = rawSegments.findIndex((segment) => segment.segment.id === over.id);
    if (newIndex < 0) return;
    void reorderSegment(String(active.id), newIndex);
  }

  function resolveDropTarget(current: SegmentList, activeId: string, overId: string) {
    const sourceSegment = current.find((segment) => segment.entries.some((entry) => entry.entry.id === activeId));
    if (!sourceSegment) return null;

    if (overId.startsWith(SEGMENT_CONTAINER_PREFIX)) {
      const targetSegmentId = overId.slice(SEGMENT_CONTAINER_PREFIX.length);
      const targetSegment = current.find((segment) => segment.segment.id === targetSegmentId);
      if (!targetSegment) return null;
      return { sourceSegment, targetSegment, targetIndex: targetSegment.entries.length };
    }

    const targetSegment = current.find((segment) => segment.entries.some((entry) => entry.entry.id === overId));
    if (!targetSegment) return null;
    return {
      sourceSegment,
      targetSegment,
      targetIndex: targetSegment.entries.findIndex((entry) => entry.entry.id === overId),
    };
  }

  function handleEntryDragStart(event: DragStartEvent) {
    setActiveEntryId(String(event.active.id));
  }

  function handleEntryDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);

    setOptimisticSegments((prev) => {
      const current = prev ?? rawSegments;
      const resolved = resolveDropTarget(current, activeId, overId);
      if (!resolved) return prev;
      const { sourceSegment, targetSegment, targetIndex } = resolved;

      // Same segment: let dnd-kit's sortable strategy shift items via transforms.
      if (sourceSegment.segment.id === targetSegment.segment.id) return prev;

      const activeEntryData = sourceSegment.entries.find((entry) => entry.entry.id === activeId);
      if (!activeEntryData) return prev;

      return current.map((segment) => {
        if (segment.segment.id === sourceSegment.segment.id) {
          return { ...segment, entries: segment.entries.filter((entry) => entry.entry.id !== activeId) };
        }
        if (segment.segment.id === targetSegment.segment.id) {
          const nextEntries = [...segment.entries];
          nextEntries.splice(targetIndex, 0, activeEntryData);
          return { ...segment, entries: nextEntries };
        }
        return segment;
      });
    });
  }

  function handleEntryDragCancel() {
    setActiveEntryId(null);
    setOptimisticSegments(null);
  }

  function handleEntryDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveEntryId(null);
    if (!over) {
      setOptimisticSegments(null);
      return;
    }

    const activeId = String(active.id);
    const overId = String(over.id);
    const current = optimisticSegments ?? rawSegments;
    const resolved = resolveDropTarget(current, activeId, overId);
    if (!resolved) {
      setOptimisticSegments(null);
      return;
    }
    const { sourceSegment, targetSegment, targetIndex } = resolved;

    // Same-segment: optimistic state hasn't moved the entry yet — apply arrayMove
    // now so the UI keeps the new order until the backend patch arrives.
    if (sourceSegment.segment.id === targetSegment.segment.id) {
      const oldIndex = sourceSegment.entries.findIndex((entry) => entry.entry.id === activeId);
      if (oldIndex === targetIndex) {
        setOptimisticSegments(null);
        return;
      }
      setOptimisticSegments((prev) => {
        const base = prev ?? rawSegments;
        return base.map((segment) => {
          if (segment.segment.id !== targetSegment.segment.id) return segment;
          const nextEntries = [...segment.entries];
          const [moved] = nextEntries.splice(oldIndex, 1);
          nextEntries.splice(targetIndex, 0, moved);
          return { ...segment, entries: nextEntries };
        });
      });
    }

    void movePlaylistEntry(activeId, targetSegment.segment.id, targetIndex);
  }

  return (
    <Panel as="section">
      <Panel.Header>
        <Label.xs className="text-tertiary mr-auto">Segments</Label.xs>
        <Button.Icon label="New segment" onClick={handleNewSegment}>
          <FolderPlus />
        </Button.Icon>
      </Panel.Header>

      <Panel.Body scroll={false}>
        <ScrollArea>
          <DndContext sensors={segmentSensors} collisionDetection={closestCenter} onDragEnd={handleSegmentDragEnd}>
            <SortableContext items={displayedSegments.map((segment) => segment.segment.id)} strategy={verticalListSortingStrategy}>
              <DndContext
                sensors={entrySensors}
                collisionDetection={closestCenter}
                onDragStart={handleEntryDragStart}
                onDragOver={handleEntryDragOver}
                onDragEnd={handleEntryDragEnd}
                onDragCancel={handleEntryDragCancel}
              >
                <Accordion type='multiple' value={expandedSegmentIds} onValueChange={handleSegmentValueChange}>
                  {displayedSegments.map((segment) => (
                    <PlaylistSegmentGroup
                      key={segment.segment.id}
                      segment={segment}
                      isEntryDragActive={activeEntryId !== null}
                    />
                  ))}
                </Accordion>
                <DragOverlay dropAnimation={dropAnimation}>
                  {activeEntry ? <SegmentEntryDragOverlay item={activeEntry.item} /> : null}
                </DragOverlay>
              </DndContext>
            </SortableContext>
          </DndContext>
        </ScrollArea>
      </Panel.Body>
    </Panel>
  );

  function handleSegmentValueChange(value: string | string[]) {
    setExpandedSegmentIds(Array.isArray(value) ? value : value ? [value] : []);
  }
}
