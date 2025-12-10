```typescript
import * as tf from '@tensorflow/tfjs';

export class TensorFlowBrowserRunner {
  private model: tf.GraphModel | null = null;
  private modelPath: string | null = null;

  async loadModel(modelPath: string): Promise<void> {
    try {
      this.model = await tf.loadGraphModel(modelPath);
      this.modelPath = modelPath;
      console.log('TensorFlow.js model loaded successfully from', modelPath);
    } catch (error) {
      console.error('Error loading TensorFlow.js model:', error);
      throw error;
    }
  }

  async runModel(input: any): Promise<any> {
    if (!this.model) {
      throw new Error('Model not loaded. Please call loadModel() first.');
    }

    try {
      const inputTensor = tf.tensor(input);
      const output = await this.model.predict(inputTensor) as tf.Tensor;
      const outputData = await output.array();
      tf.dispose(inputTensor);
      tf.dispose(output);
      return outputData;
    } catch (error) {
      console.error('Error running TensorFlow.js model:', error);
      throw error;
    }
  }

  getModelPath(): string | null {
    return this.modelPath;
  }

  disposeModel(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      this.modelPath = null;
      console.log('TensorFlow.js model disposed.');
    }
  }
}
```