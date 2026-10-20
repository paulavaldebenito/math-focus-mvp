import type { EmojiPictographPublic, ExerciseImagePublic, ExerciseOptionPublic, ExerciseVisualDescriptor } from "../api/types.js";
import { isEmojiPictograph } from "../api/types.js";
import type { Interest } from "../lib/interests.js";
import { EmojiPictograph } from "./EmojiPictograph.js";
import { ExerciseImage } from "./ExerciseImage.js";
import { ExerciseVisual } from "./ExerciseVisual.js";

interface Props {
  image?: ExerciseImagePublic | EmojiPictographPublic | null;
  visual?: ExerciseVisualDescriptor | null;
  interest?: Interest;
  options?: ExerciseOptionPublic[];
}

/**
 * Qué apoyo visual acompaña al enunciado — uno solo, nunca dos que
 * dupliquen cantidades: pictograma de emojis (1.°–2.°), imagen del banco
 * visual o, como respaldo, el dibujo de emojis del descriptor `visual`.
 * Ver specs/010-banco-visual-completo/estructura_visual_por_curso.md.
 */
export function ExerciseIllustration({ image, visual, interest, options }: Props) {
  if (image && isEmojiPictograph(image)) return <EmojiPictograph image={image} />;
  if (image) return <ExerciseImage image={image} options={options} />;
  if (visual) return <ExerciseVisual visual={visual} interest={interest} />;
  return null;
}
