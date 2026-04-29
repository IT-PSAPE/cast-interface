import { forwardRef, type CSSProperties, type HTMLAttributes } from 'react';
import { useScrollAreaRootContext } from './context';
import { mergeRefs } from './utils';

export interface ScrollAreaCornerProps extends HTMLAttributes<HTMLDivElement> {}

export const ScrollAreaCorner = forwardRef<HTMLDivElement, ScrollAreaCornerProps>(function ScrollAreaCorner(
  { className, style, ...elementProps },
  forwardedRef,
) {
  const { cornerRef, cornerSize, hiddenState } = useScrollAreaRootContext();

  if (hiddenState.corner) return null;

  const baseStyle: CSSProperties = {
    position: 'absolute',
    bottom: 0,
    insetInlineEnd: 0,
    width: cornerSize.width,
    height: cornerSize.height,
    ...style,
  };

  return (
    <div
      {...elementProps}
      ref={mergeRefs(forwardedRef, cornerRef)}
      className={className}
      style={baseStyle}
    />
  );
});
