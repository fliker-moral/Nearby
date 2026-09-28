// Модель данных стороны заявителя (пожилой человек создаёт просьбы о помощи).

export type ReqStatus = 'searching' | 'offer' | 'in_progress' | 'done';

export interface Volunteer {
  id: string;
  name: string;
  age: number;
  verified: boolean;
  rating_score: number;
  rating_count: number;
  done_count: number;
  distance_km: number;
  detail: string; // «Студент МГТУ им. Баумана»
  message: string; // отклик волонтёра
}

export interface MyRequest {
  id: string;
  kind: string; // meds / groceries / home / animals / escort
  title: string;
  description: string;
  address: string;
  when: string; // «Сегодня, до 18:00»
  createdAt: string;
  status: ReqStatus;
  volunteer?: Volunteer;
  reviewed?: boolean;
}
