import type { Presentation, PresentationEntityType, PresentationKind } from './types';

interface PresentationEntityInput {
  id: string;
  title: string;
  kind: PresentationKind;
  templateId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export function getPresentationEntityType(kind: PresentationKind): PresentationEntityType {
  return kind === 'lyrics' ? 'lyric' : 'presentation';
}

export function buildPresentationEntity({ id, title, kind, templateId = null, createdAt, updatedAt }: PresentationEntityInput): Presentation {
  if (kind === 'lyrics') {
    return {
      id,
      title,
      kind,
      entityType: 'lyric',
      templateId,
      createdAt,
      updatedAt
    };
  }

    return {
      id,
      title,
      kind,
      entityType: 'presentation',
      templateId,
      createdAt,
      updatedAt
    };
}

export function getPresentationEntityLabel(entity: Pick<Presentation, 'entityType'> | PresentationEntityType): 'Presentation' | 'Lyric' {
  const entityType = typeof entity === 'string' ? entity : entity.entityType;
  return entityType === 'lyric' ? 'Lyric' : 'Presentation';
}

export function isLyricPresentation(presentation: Presentation | null | undefined): boolean {
  return presentation?.entityType === 'lyric';
}
