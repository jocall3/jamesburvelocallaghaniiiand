export type PluginId = string;

/**
 * Represents the vendor information provided in the plugin manifest.
 */
export interface PluginVendor {
    name: string;
    url?: string;
    email?: string;
}

/**
 * Represents a dependency required by the plugin.
 */
export interface PluginDependency {
    pluginId: PluginId;
    isOptional: boolean;
}

/**
 * Defines the IDE build compatibility range.
 */
export interface IdeaVersion {
    sinceBuild: string;
    untilBuild?: string;
}

/**
 * Represents an entry point within the plugin, such as an Action or Component.
 */
export interface PluginEntryPoint {
    /**
     * The unique identifier for the entry point (e.g., action ID).
     */
    id: string;
    
    /**
     * The fully qualified class name implementing the entry point.
     */
    implementationClass: string;
    
    /**
     * Type of the entry point (e.g., "ApplicationComponent", "ProjectComponent", "Action").
     */
    type: 'Action' | 'Component' | 'Extension' | 'Listener';
}

/**
 * Describes the structure, metadata, and entry points for a third-party plugin manifest.
 */
export interface PluginManifest {
    /**
     * The unique identifier of the plugin (e.g., "com.intellij.plugins.myplugin").
     */
    id: PluginId;

    /**
     * The human-readable name of the plugin.
     */
    name: string;

    /**
     * The version string of the plugin.
     */
    version: string;

    /**
     * A description of the plugin's functionality (often HTML).
     */
    description?: string;

    /**
     * Change notes for the current version (often HTML).
     */
    changeNotes?: string;

    /**
     * Information about the plugin author or company.
     */
    vendor?: PluginVendor;

    /**
     * Specifies the compatibility with IDE build numbers.
     */
    ideaVersion?: IdeaVersion;

    /**
     * A list of plugin IDs that this plugin depends on.
     */
    dependencies?: PluginDependency[];

    /**
     * A list of tags or categories associated with the plugin.
     */
    tags?: string[];

    /**
     * The URL where the plugin binary can be downloaded.
     */
    downloadUrl?: string;

    /**
     * The size of the plugin package in bytes.
     */
    size?: number;

    /**
     * Timestamp of the last update or release date.
     */
    publishDate?: number;

    /**
     * Usage statistics: number of downloads.
     */
    downloads?: number;

    /**
     * Usage statistics: average rating.
     */
    rating?: number;

    /**
     * Defined entry points for the plugin execution.
     */
    entryPoints?: PluginEntryPoint[];

    /**
     * Arbitrary metadata key-value pairs.
     */
    metadata?: Record<string, unknown>;
}