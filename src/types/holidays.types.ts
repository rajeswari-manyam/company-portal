export interface Holiday {
  id: string;
  name: string;
  date: string;
  type?: string;
}

export interface HolidayMonthGroupType {
  month: number;
  year: number;
  monthName: string;
  items: Holiday[];
}