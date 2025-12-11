import useSWR from 'swr';
import { FigmaFile, FigmaFileResponse, FigmaNodesResponse, GetFileParams, GetFileNodesParams, GetImagesParams, GetImagesResponse, ImageFillsResponse } from '../types/figma';
import { fetcher } from '../utils/fetcher';
import useAuth from './useAuth';

export const useFigmaFile = (fileKey: string | null | undefined, params?: GetFileParams) => {
  const { token } = useAuth();

  const url = fileKey ? `/v1/files/${fileKey}${params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ''}` : null;

  const { data, error, isLoading } = useSWR<FigmaFileResponse>(
    token && fileKey ? url : null,
    fetcher
  );

  const file: FigmaFile | undefined = data?.document ? {
    ...data,
    document: data.document,
    components: data.components,
    componentSets: data.componentSets,
    styles: data.styles,
  } : undefined;

  return {
    file,
    error,
    isLoading,
  };
};

export const useFigmaFileNodes = (fileKey: string | null | undefined, params: GetFileNodesParams) => {
  const { token } = useAuth();

  const url = fileKey ? `/v1/files/${fileKey}/nodes?ids=${params.ids}${params.version ? `&version=${params.version}` : ''}${params.depth ? `&depth=${params.depth}` : ''}${params.geometry ? `&geometry=${params.geometry}` : ''}${params.plugin_data ? `&plugin_data=${params.plugin_data}` : ''}` : null;

  const { data, error, isLoading } = useSWR<FigmaNodesResponse>(
    token && fileKey && params.ids ? url : null,
    fetcher
  );

  return {
    nodes: data?.nodes,
    error,
    isLoading,
  };
};

export const useFigmaImages = (fileKey: string | null | undefined, params: GetImagesParams) => {
  const { token } = useAuth();

  const url = fileKey ? `/v1/images/${fileKey}${params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ''}` : null;

  const { data, error, isLoading } = useSWR<GetImagesResponse>(
    token && fileKey && params.ids ? url : null,
    fetcher
  );

  return {
    images: data?.images,
    error,
    isLoading,
  };
};

export const useFigmaImageFills = (fileKey: string | null | undefined) => {
  const { token } = useAuth();

  const url = fileKey ? `/v1/files/${fileKey}/images` : null;

  const { data, error, isLoading } = useSWR<ImageFillsResponse>(
    token && fileKey ? url : null,
    fetcher
  );

  return {
    imageFills: data?.meta?.images,
    error,
    isLoading,
  };
};