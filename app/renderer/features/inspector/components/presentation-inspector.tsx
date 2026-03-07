import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../../components/button';
import { SegmentedControl, SegmentedControlItem } from '../../../components/segmented-control';
import { FieldInput, FieldSelect, LabeledField } from '../../../components/labeled-field';
import { useNavigation } from '../../../contexts/navigation-context';
import { useSlides } from '../../../contexts/slide-context';

const NO_PLAYLIST_SEGMENT_OPTION_VALUE = '__not-in-playlist__';

function segmentOptionValue(segmentId: string | null): string {
  return segmentId ?? NO_PLAYLIST_SEGMENT_OPTION_VALUE;
}

function segmentIdFromOptionValue(value: string): string | null {
  return value === NO_PLAYLIST_SEGMENT_OPTION_VALUE ? null : value;
}

export function PresentationInspector() {
  const {
    activeBundle,
    currentPresentation,
    currentPlaylistId,
    currentPresentationId,
    renamePresentation,
    moveCurrentPresentationToSegment,
    setPresentationKind
  } = useNavigation();
  const { slides } = useSlides();
  const [titleDraft, setTitleDraft] = useState('');
  const [targetSegmentOption, setTargetSegmentOption] = useState(segmentOptionValue(null));

  const selectedTree = activeBundle?.playlists.find((tree) => tree.playlist.id === currentPlaylistId) ?? null;

  const segmentOptions = useMemo(() => {
    const options = [{ value: segmentOptionValue(null), label: 'Not in selected playlist' }];
    if (!selectedTree) return options;
    for (const segment of selectedTree.segments) {
      options.push({ value: segment.segment.id, label: segment.segment.name });
    }
    return options;
  }, [selectedTree]);

  const currentSegmentId = useMemo(() => {
    if (!selectedTree || !currentPresentationId) return null;
    for (const segment of selectedTree.segments) {
      const hasPresentation = segment.entries.some((entry) => entry.presentation.id === currentPresentationId);
      if (hasPresentation) return segment.segment.id;
    }
    return null;
  }, [selectedTree, currentPresentationId]);

  const currentSegmentOption = segmentOptionValue(currentSegmentId);
  const canMove = Boolean(currentPlaylistId && currentPresentationId);
  const hasPendingMove = targetSegmentOption !== currentSegmentOption;
  const canRename = Boolean(currentPresentation && titleDraft.trim() && titleDraft.trim() !== currentPresentation.title);

  useEffect(() => {
    setTargetSegmentOption(currentSegmentOption);
  }, [currentSegmentOption]);

  useEffect(() => {
    if (!currentPresentation) {
      setTitleDraft('');
      return;
    }
    setTitleDraft(currentPresentation.title);
  }, [currentPresentation]);

  function handleSegmentChange(value: string) {
    setTargetSegmentOption(value);
  }

  function handleTitleChange(value: string) {
    setTitleDraft(value);
  }

  function handleRenameTitle() {
    if (!currentPresentation) return;
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === currentPresentation.title) return;
    void renamePresentation(currentPresentation.id, trimmed);
  }

  function handleMoveSegment() {
    if (!canMove || !hasPendingMove) return;
    void moveCurrentPresentationToSegment(segmentIdFromOptionValue(targetSegmentOption));
  }

  function handleSetCanvasType() {
    if (!currentPresentation || currentPresentation.kind === 'canvas') return;
    void setPresentationKind(currentPresentation.id, 'canvas');
  }

  function handleSetLyricsType() {
    if (!currentPresentation || currentPresentation.kind === 'lyrics') return;
    void setPresentationKind(currentPresentation.id, 'lyrics');
  }

  if (!currentPresentation) {
    return <div className="text-[12px] text-text-muted">No presentation selected.</div>;
  }

  return (
    <div className="grid gap-3">
      <div>
        <span className="text-[11px] text-text-muted uppercase tracking-wider">Title</span>
        <div className="mt-0.5 grid gap-1.5">
          <FieldInput type="text" value={titleDraft} onChange={handleTitleChange} />
          <Button onClick={handleRenameTitle} disabled={!canRename} className="w-fit">
            Rename
          </Button>
        </div>
      </div>

      <div>
        <span className="text-[11px] text-text-muted uppercase tracking-wider">Library</span>
        <p className="text-[14px] text-text-primary m-0 mt-0.5">{activeBundle?.library.name ?? '—'}</p>
      </div>

      <div className="grid gap-1.5">
        <span className="text-[11px] text-text-muted uppercase tracking-wider">Presentation Type</span>
        <SegmentedControl label="Presentation type">
          <SegmentedControlItem
            active={currentPresentation.kind === 'canvas'}
            onClick={handleSetCanvasType}
            title="Canvas presentation"
          >
            Canvas
          </SegmentedControlItem>
          <SegmentedControlItem
            active={currentPresentation.kind === 'lyrics'}
            onClick={handleSetLyricsType}
            title="Lyrics presentation"
          >
            Lyrics
          </SegmentedControlItem>
        </SegmentedControl>
      </div>

      <div className="flex gap-4">
        <div>
          <span className="text-[11px] text-text-muted uppercase tracking-wider">Slides</span>
          <p className="text-[14px] text-text-primary m-0 mt-0.5">{slides.length}</p>
        </div>
        <div>
          <span className="text-[11px] text-text-muted uppercase tracking-wider">Created</span>
          <p className="text-[12px] text-text-secondary m-0 mt-0.5">
            {new Date(currentPresentation.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid gap-1.5">
        <LabeledField label="Playlist Segment" wide>
          <FieldSelect value={targetSegmentOption} onChange={handleSegmentChange} options={segmentOptions} />
        </LabeledField>
        <Button onClick={handleMoveSegment} disabled={!canMove || !hasPendingMove} className="w-fit">
          Move to Segment
        </Button>
      </div>
    </div>
  );
}
