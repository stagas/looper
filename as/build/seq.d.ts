declare namespace __AdaptedExports {
  /** Exported memory */
  export const memory: WebAssembly.Memory;
  // Exported runtime interface
  export function __new(size: number, id: number): number;
  export function __pin(ptr: number): number;
  export function __unpin(ptr: number): void;
  export function __collect(): void;
  export const __rtti_base: number;
  /**
   * as/assembly/seq/index/add
   * @param x `f64`
   * @param y `f64`
   * @returns `f64`
   */
  export function add(x: number, y: number): number;
  /**
   * as/assembly/alloc/heap_alloc
   * @param size `usize`
   * @returns `usize`
   */
  export function heap_alloc(size: number): number;
  /**
   * as/assembly/alloc/heap_free
   * @param ptr `usize`
   */
  export function heap_free(ptr: number): void;
  /**
   * as/assembly/alloc/allocI32
   * @param length `i32`
   * @returns `usize`
   */
  export function allocI32(length: number): number;
  /**
   * as/assembly/alloc/allocU32
   * @param length `i32`
   * @returns `usize`
   */
  export function allocU32(length: number): number;
  /**
   * as/assembly/alloc/allocF32
   * @param length `i32`
   * @returns `usize`
   */
  export function allocF32(length: number): number;
}
/** Instantiates the compiled WebAssembly module with the given imports. */
export declare function instantiate(module: WebAssembly.Module, imports: {
  env: unknown,
}): Promise<typeof __AdaptedExports>;
