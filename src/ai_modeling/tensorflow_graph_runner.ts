import * as tf from '@tensorflow/tfjs';

export class TensorFlowGraphRunner {
  private model: tf.GraphModel | null = null;

  async loadModel(modelPath: string) {
    try {
      this.model = await tf.loadGraphModel(modelPath);
      console.log('TensorFlow model loaded successfully.');
    } catch (error) {
      console.error('Error loading TensorFlow model:', error);
      throw error; // Re-throw to propagate the error.
    }
  }

  async runInference(inputData: any, inputName: string, outputName: string): Promise<any> {
    if (!this.model) {
      throw new Error('Model not loaded. Please load the model first.');
    }

    try {
      const inputTensor = tf.tensor(inputData); // Assuming inputData is suitable for tf.tensor
      const results = await this.model.execute({ [inputName]: inputTensor }, outputName);

        if (Array.isArray(results)) {
            const resultTensors = results as tf.Tensor[];
            const outputData: any[] = [];
            for (const tensor of resultTensors) {
                outputData.push(await tensor.data()); // or tensor.array() for nested structure
                tensor.dispose(); // clean up memory
            }
            return outputData;
        } else {
            const resultTensor = results as tf.Tensor;
            const outputData = await resultTensor.data(); // or resultTensor.array()
            resultTensor.dispose(); // clean up memory
            return outputData;
        }


    } catch (error) {
      console.error('Error during inference:', error);
      throw error;
    }
  }

  dispose() {
    if (this.model) {
        // @ts-ignore  Model.dispose() doesn't exist, execute on model.
        if (typeof this.model.dispose === 'function') {
           this.model.dispose(); // Best practice.
        } else {
            // Alternative: Loop and dispose tensors if dispose not directly available on model
            const allTensors = this.model.getTrainableVariables();
            allTensors.forEach(tensor => tensor.dispose());
        }
      this.model = null;
    }
  }

}