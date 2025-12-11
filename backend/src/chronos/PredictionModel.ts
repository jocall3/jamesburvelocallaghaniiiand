import { Feature } from "./Feature";
import { FeatureExtractor } from "./FeatureExtractor";
import { TimeSeriesData } from "./DataTypes";

/**
 * Base abstract class for implementing various predictive algorithms used within the Causality Engine.
 * All concrete prediction models must extend this class and implement the `predict` method.
 */
export abstract class PredictionModel {
    protected features: Feature[] = [];
    protected featureExtractor: FeatureExtractor;

    constructor(featureExtractor: FeatureExtractor) {
        this.featureExtractor = featureExtractor;
    }

    /**
     * Adds a feature definition to the model's configuration.
     * @param feature The feature to add.
     */
    public addFeature(feature: Feature): void {
        if (!this.features.some(f => f.id === feature.id)) {
            this.features.push(feature);
        }
    }

    /**
     * Retrieves the features currently configured for this model.
     * @returns An array of features.
     */
    public getFeatures(): Feature[] {
        return [...this.features];
    }

    /**
     * Abstract method to be implemented by concrete prediction models.
     * It performs the actual prediction based on the input time series data.
     *
     * @param trainingData The historical time series data to train or inform the prediction.
     * @param predictionHorizon The number of future steps to predict.
     * @returns A promise that resolves to the predicted time series data.
     */
    public abstract predict(trainingData: TimeSeriesData[], predictionHorizon: number): Promise<TimeSeriesData[]>;

    /**
     * Abstract method to train the model using provided data.
     * This might be called implicitly before `predict` depending on the model implementation.
     *
     * @param trainingData The historical time series data used for training.
     * @returns A promise that resolves when training is complete.
     */
    public abstract train(trainingData: TimeSeriesData[]): Promise<void>;
}
