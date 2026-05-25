export interface OptionValue {
  id: string;
  option_id: string;
  value: string;
  price_modifier: number;
  created_at?: string;
}

export interface ProductOption {
  id: string;
  product_id: string;
  name: string;
  created_at?: string;
  values?: OptionValue[];
}

export interface SelectedOption {
  option_id: string;
  option_name: string;
  value_id: string;
  value_name: string;
  price_modifier: number;
}
