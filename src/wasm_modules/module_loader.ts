```typescript
export interface WasmModule {
  instance: WebAssembly.Instance;
  module: WebAssembly.Module;
  memory: WebAssembly.Memory;
  exports: any; // Define more specific type later based on common export patterns
}

export async function loadWasmModule(
  moduleUrl: string,
  importObject: any = {} // Define type later for common import patterns
): Promise<WasmModule> {
  try {
    const response = await fetch(moduleUrl);
    const buffer = await response.arrayBuffer();
    const { module, instance } = await WebAssembly.instantiate(buffer, importObject);

    const memory = (instance.exports.memory as WebAssembly.Memory) || undefined;
    if (!memory) {
      console.warn("WASM module does not export a memory object. Some features might not work.");
    }

    return {
      instance,
      module,
      memory,
      exports: instance.exports,
    };
  } catch (error) {
    console.error("Failed to load WASM module:", error);
    throw error; // Re-throw to allow error handling higher up
  }
}

// Example usage (for documentation purposes; remove if not needed):
// async function main() {
//   try {
//     const myModule = await loadWasmModule("./my_module.wasm", {
//       env: {
//         consoleLog: (value: number) => console.log("From WASM:", value),
//       },
//     });

//     // Access exported functions, memory, etc.
//     const result = myModule.exports.add(5, 3);
//     console.log("Result from WASM:", result);

//     if (myModule.memory) {
//       const memoryBuffer = new Uint8Array(myModule.memory.buffer);
//       // Access memory...
//     }

//   } catch (error) {
//     console.error("Error in main:", error);
//   }
// }

// main();
```