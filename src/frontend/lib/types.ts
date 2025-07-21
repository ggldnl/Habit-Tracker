export interface List {
  list_id: number;
  list_name: string;
  list_color: number;
}

export interface Entry {
  entry_id: number;
  list_id: number;
  entry_text: string;
  entry_checked: boolean;
}

export interface Color {
  color_id: number;
  color_name: string;
  color_value: string;
}
