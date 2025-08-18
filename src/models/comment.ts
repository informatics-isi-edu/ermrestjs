export type CommentType =
  | {
      value: string;
      isHTML: boolean;
      unformatted: string;
      displayMode: CommentDisplayModes;
    }
  | false
  | null;

export enum CommentDisplayModes {
  INLINE = 'inline',
  TOOLTIP = 'tooltip',
}
