


type CardAssetViewProps = {
  item_id : string;
  path : string;
  status : 'uploading' | 'ready' | 'failed';
};  

export type CardItemAndAssetViewReturnDto = {
  item_id : string;
  type: "text" | "image" | "video";
  x: number;
  y: number;
  width: number;
  height: number | undefined | null;
  rotation: number;
  scale_x: number;
  scale_y: number;
  opacity: number | undefined | null;
  z_index: number | undefined | null;
  is_locked: boolean | undefined | null;
  is_visible: boolean | undefined | null;
  name: string | undefined | null;
  option: Record<string, any>;
  card_asset : CardAssetViewProps | null;
};