```javascript
const { CloudIotClient } = require('@google-cloud/iot');

/**
 * AssetTrackerService class to manage and track physical assets using Cloud IoT.
 */
class AssetTrackerService {
  /**
   * Constructor for the AssetTrackerService.
   * @param {string} projectId - The Google Cloud project ID.
   * @param {string} cloudRegion - The Cloud IoT region.
   * @param {string} registryId - The ID of the Cloud IoT registry.
   */
  constructor(projectId, cloudRegion, registryId) {
    this.projectId = projectId;
    this.cloudRegion = cloudRegion;
    this.registryId = registryId;
    this.iotClient = new CloudIotClient();
    this.parentName = this.iotClient.registryPath(
        this.projectId,
        this.cloudRegion,
        this.registryId
    );
  }

  /**
   * Retrieves the current state of a device.
   * @param {string} deviceId - The ID of the device.
   * @returns {Promise<object>} - A promise that resolves with the device state, or rejects with an error.
   */
  async getDeviceState(deviceId) {
    try {
      const deviceName = this.iotClient.devicePath(
        this.projectId,
        this.cloudRegion,
        this.registryId,
        deviceId
      );

      const [device] = await this.iotClient.getDevice({ name: deviceName });
      return device.state;
    } catch (error) {
      console.error(`Failed to get device state for ${deviceId}:`, error);
      throw error;
    }
  }


  /**
   * Sends a command to a specific device.
   * @param {string} deviceId - The ID of the device.
   * @param {string} commandData - The command data to send.  Must be a base64 encoded string
   * @returns {Promise<object>} - A promise that resolves with the command response, or rejects with an error.
   */
  async sendCommandToDevice(deviceId, commandData) {
    try {
        const deviceName = this.iotClient.devicePath(
          this.projectId,
          this.cloudRegion,
          this.registryId,
          deviceId
        );

        const request = {
            name: deviceName,
            binaryData: Buffer.from(commandData, 'base64'),
        };

        const [response] = await this.iotClient.sendCommandToDevice(request);
        return response;

    } catch (error) {
        console.error(`Failed to send command to device ${deviceId}:`, error);
        throw error;
    }
  }


  /**
   * Updates the configuration of a device.
   * @param {string} deviceId - The ID of the device.
   * @param {string} configurationData - The configuration data to set. Must be a base64 encoded string
   * @returns {Promise<object>} - A promise that resolves with the updated configuration, or rejects with an error.
   */
  async updateDeviceConfiguration(deviceId, configurationData) {
    try {
        const deviceName = this.iotClient.devicePath(
          this.projectId,
          this.cloudRegion,
          this.registryId,
          deviceId
        );

        const request = {
            name: deviceName,
            binaryData: Buffer.from(configurationData, 'base64'),
        };

        const [response] = await this.iotClient.modifyCloudToDeviceConfig(request);
        return response;

    } catch (error) {
        console.error(`Failed to update configuration for device ${deviceId}:`, error);
        throw error;
    }
  }

    /**
     * Lists all devices in the registry.
     * @returns {Promise<Array<object>>} - A promise that resolves with an array of devices, or rejects with an error.
     */
    async listDevices() {
        try {
            const [devices] = await this.iotClient.listDevices({
                parent: this.parentName,
            });
            return devices;
        } catch (error) {
            console.error('Failed to list devices:', error);
            throw error;
        }
    }

  /**
   * Creates a new device in the registry.
   * @param {string} deviceId - The ID of the new device.
   * @param {object} deviceConfig - The configuration for the new device.
   * @returns {Promise<object>} - A promise that resolves with the created device, or rejects with an error.
   */
  async createDevice(deviceId, deviceConfig = {}) {
      try {
          const device = {
              id: deviceId,
              ...deviceConfig,
          };

          const request = {
              parent: this.parentName,
              device: device,
          };

          const [response] = await this.iotClient.createDevice(request);
          return response;
      } catch (error) {
          console.error(`Failed to create device ${deviceId}:`, error);
          throw error;
      }
  }

  /**
   * Deletes a device from the registry.
   * @param {string} deviceId - The ID of the device to delete.
   * @returns {Promise<void>} - A promise that resolves when the device is deleted, or rejects with an error.
   */
  async deleteDevice(deviceId) {
      try {
          const deviceName = this.iotClient.devicePath(
            this.projectId,
            this.cloudRegion,
            this.registryId,
            deviceId
          );

          const request = {
              name: deviceName,
          };

          await this.iotClient.deleteDevice(request);
          console.log(`Device ${deviceId} deleted successfully.`);
      } catch (error) {
          console.error(`Failed to delete device ${deviceId}:`, error);
          throw error;
      }
  }


  /**
   * Attaches a device to a portfolio ID.
   * This is a placeholder; actual implementation depends on how portfolio IDs are managed.
   * @param {string} deviceId - The ID of the device to attach.
   * @param {string} portfolioId - The ID of the portfolio to attach the device to.
   * @returns {Promise<void>} - A promise that resolves when the device is attached, or rejects with an error.
   */
  async attachDeviceToPortfolio(deviceId, portfolioId) {
      // Placeholder implementation:
      // In a real-world scenario, you would likely update a database or some other data store
      // to associate the device with the portfolio.
      console.log(`Attaching device ${deviceId} to portfolio ${portfolioId}`);
      return Promise.resolve();
  }
}

module.exports = AssetTrackerService;
```