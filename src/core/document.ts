"use strict";

import type {
  DocPoint,
  DocStroke,
  DocumentItem,
  RendererMode,
} from "../types";

const modeToCompositeOperation = (
  mode: RendererMode,
): GlobalCompositeOperation =>
  mode === "erase" ? "destination-out" : "source-over";

const createId = (): string => crypto.randomUUID();

const createPoint = (
  x: number,
  y: number,
  size: number,
): DocPoint => ({
  x,
  y,
  size,
});

export class Document {
  private items: DocumentItem[] = [];
  private currentStrokeId: string | null = null;

  add(item: DocumentItem): void {
    this.items.push(item);
  }

  remove(id: string): boolean {
    const index = this.items.findIndex(
      (item) => item.data.id === id,
    );

    if (index < 0) {
      return false;
    }

    this.items.splice(index, 1);

    if (this.currentStrokeId === id) {
      this.currentStrokeId = null;
    }

    return true;
  }

  get(id: string): DocumentItem | undefined {
    return this.items.find(
      (item) => item.data.id === id,
    );
  }

  getItems(): readonly DocumentItem[] {
    return this.items;
  }

  getCurrentStroke(): DocStroke | undefined {
    if (this.currentStrokeId === null) {
      return undefined;
    }

    const item = this.get(this.currentStrokeId);

    return item?.type === "stroke"
      ? item.data
      : undefined;
  }

  beginStroke(
    color: string,
    x: number,
    y: number,
    size: number,
    mode: RendererMode,
  ): DocStroke {
    this.endStroke();

    const stroke: DocStroke = {
      id: createId(),
      color,
      opacity: 1,
      compositeOperation: modeToCompositeOperation(mode),
      points: [
        createPoint(x, y, size),
      ],
    };

    this.add({
      type: "stroke",
      data: stroke,
    });

    this.currentStrokeId = stroke.id;

    return stroke;
  }

  addPoint(
    x: number,
    y: number,
    size: number,
  ): boolean {
    const currentStroke = this.getCurrentStroke();

    if (!currentStroke) {
      return false;
    }

    const itemIndex = this.items.findIndex(
      (item) =>
        item.type === "stroke" &&
        item.data.id === currentStroke.id,
    );

    if (itemIndex < 0) {
      this.currentStrokeId = null;
      return false;
    }

    const point = createPoint(x, y, size);

    const updatedStroke: DocStroke = {
      ...currentStroke,
      points: [
        ...currentStroke.points,
        point,
      ],
    };

    this.items[itemIndex] = {
      type: "stroke",
      data: updatedStroke,
    };

    return true;
  }

  endStroke(): void {
    this.currentStrokeId = null;
  }

  clear(): void {
    this.items = [];
    this.currentStrokeId = null;
  }

  getStrokes(): readonly DocStroke[] {
    return this.items
      .filter(
        (
          item,
        ): item is Extract<
          DocumentItem,
          { readonly type: "stroke" }
        > => item.type === "stroke",
      )
      .map((item) => item.data);
  }

  get size(): number {
    return this.items.length;
  }

  get isEmpty(): boolean {
    return this.items.length === 0;
  }

  get isDrawing(): boolean {
    return this.currentStrokeId !== null;
  }

  _addItem(item: DocumentItem): void {
    this.add(item);
  }

  _removeItemById(id: string): boolean {
    return this.remove(id);
  }

  _clear(): void {
    this.clear();
  }
}
