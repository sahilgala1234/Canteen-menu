import React, { useState } from 'react';
import { useEffect } from 'react';
import QRCodeScanner from './QRCodeScanner';

const API_URL = 'http://localhost:3001/api';
// Mock food items data
const menuItems = [
  { id: 1, name: 'Burger', price: 99, category: 'Fast Food' },
  { id: 2, name: 'Pizza', price: 199, category: 'Fast Food' },
  { id: 3, name: 'Salad', price: 79, category: 'Healthy' },
  { id: 4, name: 'Ice Cream', price: 49, category: 'Dessert' },
];

const Mainpage = () => {
    const [cart, setCart] = useState([]);
    const [activeTab, setActiveTab] = useState('menu');
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [menuItems, setMenuItems] = useState([]);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isregisterOpen, setIsRegisterOpen] = useState(false);
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({name:'', email: '', password: '' });

    useEffect(() => {
        fetchMenuItems();
        const token = localStorage.getItem('token');
        if (token) {
          fetchUserProfile(token);
        }
      }, []);
    
      const fetchMenuItems = async () => {
        try {
          const response = await fetch(`${API_URL}/menu`);
          const data = await response.json();
          setMenuItems(data);
          setIsLoading(false);
        } catch (err) {
          setError('Failed to fetch menu items');
          setIsLoading(false);
        }
      };

      const fetchUserProfile = async (token) => {
        try {
          const response = await fetch(`${API_URL}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          
          setUser(data);
        } catch (err) {
          localStorage.removeItem('token');
        }
      };

  const addToCart = (item) => {
    console.log(item)
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
   
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
    console.log(cart)
  };

  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setCart(cart.map(item =>
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const placeOrder = async () => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: cart.map(item => ({
            menuItem: item.id,
            quantity: item.quantity,
            price: item.price
          })),
          total: calculateTotal()
        })
      });

      if (response.ok) {
        setOrderPlaced(true);
        setCart([]);
        setTimeout(() => {
          setOrderPlaced(false);
          setActiveTab('menu');
        }, 3000);
      } else {
        throw new Error('Failed to place order');
      }
    } catch (err) {
      setError('Failed to place order. Please try again.');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();
      console.log(loginData)
      if (response.ok) {
        localStorage.setItem('token', data.token);
        await fetchUserProfile(data.token);
        setIsLoginOpen(false);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    }
  };

  
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('token', data.token);
        
        setIsRegisterOpen(false);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Registeration failed. Please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  // Components
  const MenuItem = ({ item }) => (
    
    <div style={{
      border: '1px solid #ddd',
      padding: '10px',
      margin: '10px',
      borderRadius: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <h3 style={{ margin: '0' }}>{item.name}</h3>
        <p style={{ margin: '5px 0', color: '#666' }}>{item.category}</p>
        <p style={{ margin: '5px 0' }}>₹{item.price}</p>
      </div>
      <button
        onClick={() => addToCart(item)}
        style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Add to Cart
      </button>
    </div>
  );

  const CartItem = ({ item }) => (
    <div style={{
      border: '1px solid #ddd',
      padding: '10px',
      margin: '10px',
      borderRadius: '8px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <h3 style={{ margin: '0' }}>{item.name}</h3>
        <p style={{ margin: '5px 0' }}>₹{item.price} x {item.quantity}</p>
      </div>
      <div>
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1)}
          style={{ margin: '0 5px' }}
        >-</button>
        {item.quantity}
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1)}
          style={{ margin: '0 5px' }}
        >+</button>
      </div>
    </div>
  );

  return (
    <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        padding: '20px',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h1 style={{ margin: 0 }}>Campus Canteen</h1>
          <div>
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>Welcome, {user.name}</span>
                <button
                  onClick={handleLogout}
                  style={{
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
                <div style={{
                    display: 'flex', gap: '20px',}}>
              <button
                onClick={() => setIsLoginOpen(true)}
                style={{
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Login

              </button>
               <button
               onClick={() => setIsRegisterOpen(true)}
               style={{
                 backgroundColor: '#4CAF50',
                 color: 'white',
                 border: 'none',
                 padding: '8px 16px',
                 borderRadius: '4px',
                 cursor: 'pointer'
               }}
             >
               Register
             </button>
             </div>
            )}
          </div>
        </div>
      
      {/* Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setActiveTab('menu')}
          style={{
            backgroundColor: activeTab === 'menu' ? '#4CAF50' : '#ddd',
            color: activeTab === 'menu' ? 'white' : 'black',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Menu
        </button>
        <button
          onClick={() => setActiveTab('cart')}
          style={{
            backgroundColor: activeTab === 'cart' ? '#4CAF50' : '#ddd',
            color: activeTab === 'cart' ? 'white' : 'black',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Cart ({cart.length})
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          backgroundColor: '#f44336',
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {/* Login Modal */}
      {isLoginOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '300px'
          }}>
            <h2>Login</h2>
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Login
              </button>
            </form>
            <button
              onClick={() => setIsLoginOpen(false)}
              style={{
                width: '100%',
                backgroundColor: '#ddd',
                color: 'black',
                border: 'none',
                padding: '10px',
                borderRadius: '4px',
                marginTop: '10px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Register Modal */}
      {isregisterOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '300px'
          }}>
            <h2>Register</h2>
            <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '10px' }}>
                <input
                  type="name"
                  placeholder="Name"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="email"
                  placeholder="Email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="password"
                  placeholder="Password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  width: '100%',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Register
              </button>
            </form>
            <button
              onClick={() => setIsRegisterOpen(false)}
              style={{
                width: '100%',
                backgroundColor: '#ddd',
                color: 'black',
                border: 'none',
                padding: '10px',
                borderRadius: '4px',
                marginTop: '10px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      

      {/* Order Success Message */}
      {orderPlaced && (
        <div style={{
          backgroundColor: '#4CAF50',
          color: 'white',
          padding: '10px',
          borderRadius: '4px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          Order placed successfully!
          <QRCodeScanner/>
        </div>
        
      )}


      {/* Menu Items */}
      {activeTab === 'menu' && (
        <div>
          <h2>Menu</h2>
          {isLoading ? (
            <p style={{ textAlign: 'center' }}>Loading menu items...</p>
          ) : (
            menuItems.map(item => (
              <MenuItem key={item._id} item={item} />
            ))
          )}
        </div>
      )}

      {/* Cart Items */}
      {activeTab === 'cart' && (
        <div>
          <h2>Cart</h2>
          {cart.length === 0 ? (
            <p style={{ textAlign: 'center' }}>Your cart is empty</p>
          ) : (
            <>
              {cart.map(item => (
                <CartItem key={item.id} item={item} />
              ))}
              <div style={{
                marginTop: '20px',
                padding: '20px',
                borderTop: '1px solid #ddd'
              }}>
                <h3>Total: ₹{calculateTotal()}</h3>
                <button
                  onClick={placeOrder}
                  style={{
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    padding: '10px 20px',
                    borderRadius: '4px',
                    width: '100%',
                    cursor: 'pointer'
                  }}
                >
                  Place Order
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
export default Mainpage;