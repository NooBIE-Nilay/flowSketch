import { Drawable } from "roughjs/bin/core";

type SHAPE_TYPE =
  | {
      type: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
    }
  | {
      type: "circle";
      centerX: number;
      centerY: number;
      r: number;
    };
type element_type = {
  tool: string;
  id: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  roughElement?: Drawable;
  points?: point[];
  color: string;
};
type point = number[];
interface selected_element_type extends element_type {
  offsetX?: number;
  offsetY?: number;
  position: string | null;
  offsetXArray?: number[];
  offsetYArray?: number[];
}

export type { SHAPE_TYPE, point, element_type, selected_element_type };
