export type Hotel = {
  id: string;
  name: string;
  location: string;
  description: string;
  amenities: string[];
  rating: number;
  pricePerNight: number;
};

export type Room = {
  id: string;
  hotelId: string;
  type: string;
  capacity: number;
  rate: number;
  quantity: number;
};

export type Reservation = {
  id: string;
  hotelId: string;
  roomId: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  status: 'confirmed' | 'pending' | 'completed';
  total: number;
};
