import { FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { Hotel, Reservation, Room } from './api/types';

const pages = ['landing', 'details', 'booking', 'bookings', 'admin'] as const;
type Page = (typeof pages)[number];

type AuthForm = {
  name: string;
  email: string;
  password: string;
};

type ReservationDraft = {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
};

function App() {
  const [page, setPage] = useState<Page>('landing');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedHotelId, setSelectedHotelId] = useState('hotel-1');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: 'customer' | 'staff' } | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authForm, setAuthForm] = useState<AuthForm>({ name: '', email: 'maya@example.com', password: 'password123' });
  const [authError, setAuthError] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [reservationDraft, setReservationDraft] = useState<ReservationDraft>({
    hotelId: 'hotel-1',
    roomId: 'room-1',
    checkIn: '2026-11-14',
    checkOut: '2026-11-17',
    guests: 2,
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [hotelData, roomData, reservationData, currentUser] = await Promise.all([
          api.getHotels(),
          api.getRooms(),
          api.getReservations(),
          api.getCurrentUser(),
        ]);

        setHotels(hotelData);
        setRooms(roomData);
        setReservations(reservationData);
        setUser(currentUser);

        if (hotelData[0]) {
          setSelectedHotelId(hotelData[0].id);
          setReservationDraft((draft) => ({
            ...draft,
            hotelId: hotelData[0].id,
            roomId: roomData.find((room) => room.hotelId === hotelData[0].id)?.id ?? draft.roomId,
          }));
        }
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : 'Unable to load data.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const activeHotel = useMemo(
    () => hotels.find((hotel) => hotel.id === selectedHotelId) ?? hotels[0],
    [hotels, selectedHotelId],
  );

  const hotelRooms = useMemo(
    () => rooms.filter((room) => room.hotelId === (activeHotel?.id ?? 'hotel-1')),
    [activeHotel?.id, rooms],
  );

  useEffect(() => {
    if (!activeHotel) {
      return;
    }

    setReservationDraft((draft) => {
      if (draft.hotelId === activeHotel.id && hotelRooms.some((room) => room.id === draft.roomId)) {
        return draft;
      }

      return {
        ...draft,
        hotelId: activeHotel.id,
        roomId: hotelRooms[0]?.id ?? '',
      };
    });
  }, [activeHotel, hotelRooms]);

  const handleAuthSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setAuthError('');

    try {
      if (authMode === 'login') {
        const result = await api.login(authForm.email, authForm.password);
        setUser(result.user);
      } else {
        await api.register({
          name: authForm.name,
          email: authForm.email,
          password: authForm.password,
          role: 'customer',
        });

        const result = await api.login(authForm.email, authForm.password);
        setUser(result.user);
      }

      setPage('landing');
      setAuthForm({ name: '', email: '', password: '' });
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Authentication failed.');
    }
  };

  const handleReservationSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setBookingMessage('');

    if (!user) {
      setAuthMode('login');
      setPage('landing');
      setAuthError('Please sign in to complete a booking.');
      return;
    }

    if (!activeHotel || !reservationDraft.roomId) {
      setBookingMessage('Select a room before confirming.');
      return;
    }

    try {
      const response = await api.createReservation({
        hotelId: activeHotel.id,
        roomId: reservationDraft.roomId,
        checkIn: reservationDraft.checkIn,
        checkOut: reservationDraft.checkOut,
        guests: Number(reservationDraft.guests),
      });

      setReservations((current) => [response.reservation, ...current]);
      setPage('bookings');
      setBookingMessage('Reservation created successfully.');
    } catch (error) {
      setBookingMessage(error instanceof Error ? error.message : 'Could not create reservation.');
    }
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setPage('landing');
    setAuthError('');
  };

  const renderAuthPanel = () => (
    <div className="panel">
      {user ? (
        <>
          <h4>Welcome back</h4>
          <p>{user.name}</p>
          <p>{user.email}</p>
          <div className="actions">
            <button className="primary" onClick={() => setPage('bookings')}>My bookings</button>
            <button className="secondary" onClick={handleLogout}>Sign out</button>
          </div>
        </>
      ) : (
        <form className="form" onSubmit={handleAuthSubmit}>
          <h4>{authMode === 'login' ? 'Sign in' : 'Create account'}</h4>
          {authMode === 'register' && (
            <input
              type="text"
              value={authForm.name}
              placeholder="Your name"
              onChange={(event) => setAuthForm((current) => ({ ...current, name: event.target.value }))}
            />
          )}
          <input
            type="email"
            value={authForm.email}
            placeholder="Email address"
            onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
          />
          <input
            type="password"
            value={authForm.password}
            placeholder="Password"
            onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
          />
          {authError && <p style={{ color: '#b91c1c', margin: 0 }}>{authError}</p>}
          <div className="actions">
            <button className="primary" type="submit">{authMode === 'login' ? 'Log in' : 'Register'}</button>
            <button className="secondary" type="button" onClick={() => setAuthMode((current) => (current === 'login' ? 'register' : 'login'))}>
              {authMode === 'login' ? 'Need an account?' : 'Back to login'}
            </button>
          </div>
        </form>
      )}
    </div>
  );

  const renderLanding = () => (
    <>
      <div className="hero">
        <div className="panel">
          <h2>Find a stay that fits your trip</h2>
          <h3>Plan a premium stay in Europe</h3>
          <p>Compare stay options, view room availability, and manage bookings with one calm, intuitive dashboard.</p>
          <div className="actions">
            <button className="primary" onClick={() => setPage('booking')}>Book now</button>
            <button className="secondary" onClick={() => setPage('admin')}>View admin</button>
          </div>
        </div>
        {renderAuthPanel()}
      </div>

      <div className="cards">
        {hotels.map((hotel) => (
          <article key={hotel.id} className="panel card">
            <div className="cardMedia" />
            <h4>{hotel.name}</h4>
            <p>{hotel.location}</p>
            <span className="badge">{hotel.rating.toFixed(1)} ★</span>
            <div className="price-row">
              <strong>€{hotel.pricePerNight}/night</strong>
              <button className="primary" onClick={() => { setSelectedHotelId(hotel.id); setPage('details'); }}>
                Explore
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );

  const renderDetails = () => (
    <div className="row">
      <div className="panel">
        <div className="cardMedia" />
        <h3>{activeHotel?.name}</h3>
        <p>{activeHotel?.description}</p>
        <div className="tags">
          {activeHotel?.amenities.map((amenity) => (
            <span key={amenity} className="tag">{amenity}</span>
          ))}
        </div>
      </div>
      <div className="panel">
        <h3>Room availability</h3>
        <div className="stack">
          {hotelRooms.map((room) => (
            <div key={room.id} className="room-card">
              <div className="price-row">
                <strong>{room.type}</strong>
                <span className="badge">€{room.rate}/night</span>
              </div>
              <p>{room.capacity} guests • {room.quantity} rooms left</p>
              <button className="primary" onClick={() => {
                setReservationDraft((draft) => ({ ...draft, roomId: room.id, hotelId: activeHotel?.id ?? draft.hotelId }));
                setPage('booking');
              }}>Reserve room</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBooking = () => (
    <div className="panel">
      <h3>Complete reservation</h3>
      <form className="form compact" onSubmit={handleReservationSubmit}>
        <input value={activeHotel?.name ?? ''} readOnly />
        <select value={reservationDraft.roomId} onChange={(event) => setReservationDraft((draft) => ({ ...draft, roomId: event.target.value }))}>
          {hotelRooms.map((room) => (
            <option key={room.id} value={room.id}>{room.type}</option>
          ))}
        </select>
        <input type="date" value={reservationDraft.checkIn} onChange={(event) => setReservationDraft((draft) => ({ ...draft, checkIn: event.target.value }))} />
        <input type="date" value={reservationDraft.checkOut} onChange={(event) => setReservationDraft((draft) => ({ ...draft, checkOut: event.target.value }))} />
        <input type="number" min={1} max={8} value={reservationDraft.guests} onChange={(event) => setReservationDraft((draft) => ({ ...draft, guests: Number(event.target.value) || 1 }))} />
        {bookingMessage && <p style={{ color: bookingMessage.includes('successfully') ? '#166534' : '#b91c1c', margin: 0 }}>{bookingMessage}</p>}
        <button className="primary" type="submit">Confirm booking</button>
      </form>
    </div>
  );

  const renderBookings = () => (
    <div className="panel">
      <h3>My bookings</h3>
      <table>
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Hotel</th>
            <th>Dates</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((reservation) => (
            <tr key={reservation.id}>
              <td>{reservation.id}</td>
              <td>{hotels.find((hotel) => hotel.id === reservation.hotelId)?.name ?? 'Hotel'}</td>
              <td>{reservation.checkIn} - {reservation.checkOut}</td>
              <td><span className="badge">{reservation.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderAdmin = () => (
    <div className="panel">
      <h3>Admin dashboard</h3>
      <table>
        <thead>
          <tr>
            <th>Booking ID</th>
            <th>Guest</th>
            <th>Hotel</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((reservation) => (
            <tr key={reservation.id}>
              <td>{reservation.id}</td>
              <td>{user?.name ?? 'Guest'}</td>
              <td>{hotels.find((hotel) => hotel.id === reservation.hotelId)?.name ?? 'Hotel'}</td>
              <td><span className="badge">{reservation.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return <div className="shell"><div className="content"><p>Loading hotel data…</p></div></div>;
  }

  return (
    <div className="shell">
      <header className="topbar">
        <strong>Hotel Booking</strong>
        <nav className="nav">
          {pages.map((item) => (
            <button key={item} className={page === item ? 'primary' : 'secondary'} onClick={() => setPage(item)}>
              {item === 'landing' ? 'Landing' : item === 'details' ? 'Hotel Details' : item === 'booking' ? 'Booking' : item === 'bookings' ? 'My Bookings' : 'Admin Dashboard'}
            </button>
          ))}
        </nav>
      </header>
      <main className="content">
        {page === 'landing' && renderLanding()}
        {page === 'details' && renderDetails()}
        {page === 'booking' && renderBooking()}
        {page === 'bookings' && renderBookings()}
        {page === 'admin' && renderAdmin()}
      </main>
    </div>
  );
}

export default App;
