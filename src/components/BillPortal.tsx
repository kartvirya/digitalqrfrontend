import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  AppBar,
  Toolbar,
  IconButton,
  useTheme,
  useMediaQuery,
  Stack,
  Avatar,
} from '@mui/material';
import {
  Receipt as ReceiptIcon,
  ArrowBack as ArrowBackIcon,
  Print as PrintIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';

interface BillItem {
  name: string;
  quantity: number;
  total: number;
}

interface Bill {
  id: number;
  order_items: Record<string, [number, string]>; // [quantity, total_price]
  name: string;
  bill_total: string;
  phone: string;
  bill_time: string;
  table_number?: string;
}

interface MenuItem {
  id: number;
  name: string;
  price: string;
}

const BillPortal: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const theme = useTheme();
  const [searchParams] = useSearchParams();
  
  const tableUniqueId = searchParams.get('table');
  const roomUniqueId = searchParams.get('room');

  useEffect(() => {
    loadBills();
    loadMenuItems();
  }, [tableUniqueId, roomUniqueId]);

  const loadMenuItems = async () => {
    try {
      const items = await apiService.getMenuItems();
      setMenuItems(items);
    } catch (error) {
      console.error('Failed to load menu items:', error);
    }
  };

  const loadBills = async () => {
    try {
      setLoading(true);
      
      // Pass table/room parameters to filter bills
      let billsData;
      if (tableUniqueId) {
        billsData = await apiService.getBillsByTable(tableUniqueId);
      } else if (roomUniqueId) {
        billsData = await apiService.getBillsByRoom(roomUniqueId);
      } else {
        billsData = await apiService.getBills();
      }
      
      setBills(billsData);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load bills');
    } finally {
      setLoading(false);
    }
  };

  const getItemName = (itemId: string): string => {
    const menuItem = menuItems.find(item => item.id.toString() === itemId);
    return menuItem ? menuItem.name : `Item ${itemId}`;
  };

  const parseBillItems = (items: Record<string, [number, string]>): BillItem[] => {
    try {
      return Object.entries(items).map(([itemId, data]) => {
        const quantity = data[0];
        const totalString = data[1];
        
        // Handle different formats of total price
        let total: number;
        if (typeof totalString === 'string') {
          // Remove any non-numeric characters except decimal point
          const cleanTotal = totalString.replace(/[^\d.]/g, '');
          total = parseFloat(cleanTotal) || 0;
        } else {
          total = parseFloat(totalString) || 0;
        }
        
        return {
          name: getItemName(itemId),
          quantity: quantity || 0,
          total: total
        };
      }).filter(item => item.quantity > 0);
    } catch (error) {
      console.error('Error parsing bill items:', error);
      return [];
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const handlePrint = (bill: Bill) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const items = parseBillItems(bill.order_items);
      const total = items.reduce((sum, item) => sum + item.total, 0);
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Bill #${bill.id}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; background-color: #1a1a1a; color: #ffffff; }
              .header { text-align: center; margin-bottom: 30px; }
              .bill-info { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #333; padding: 8px; text-align: left; }
              th { background-color: #d32f2f; color: white; }
              .total { font-weight: bold; font-size: 18px; text-align: right; color: #d32f2f; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #999; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>🍽️ Restaurant Bill</h1>
              <h2>Invoice #${bill.id}</h2>
            </div>
            
            <div class="bill-info">
              <p><strong>Date:</strong> ${formatDate(bill.bill_time)}</p>
              ${bill.name !== 'Unknown' ? `<p><strong>Customer:</strong> ${bill.name}</p>` : ''}
              ${bill.phone !== '0000000000' ? `<p><strong>Phone:</strong> ${bill.phone}</p>` : ''}
              ${bill.table_number ? `<p><strong>Table:</strong> ${bill.table_number}</p>` : ''}
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.total.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total">
              <strong>Total Amount: ₹${total.toFixed(2)}</strong>
            </div>
            
            <div class="footer">
              <p>Thank you for dining with us!</p>
              <p>Please visit again</p>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleBackToMenu = () => {
    const url = roomUniqueId ? `/?room=${roomUniqueId}` : (tableUniqueId ? `/?table=${tableUniqueId}` : '/');
    window.location.href = url;
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'var(--bg-primary)',
        }}
      >
        <CircularProgress size={80} sx={{ color: 'var(--accent-red)', mb: 3 }} />
        <Typography variant="h5" sx={{ color: 'var(--text-primary)', fontWeight: 600, mb: 1 }}>
          Loading Bills...
        </Typography>
        <Typography variant="body1" sx={{ color: 'var(--text-secondary)' }}>
          Preparing your billing information
        </Typography>
      </Box>
    );
  }

  if (selectedBill) {
    const items = parseBillItems(selectedBill.order_items);
    const total = items.reduce((sum, item) => sum + item.total, 0);

    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <AppBar 
          position="sticky" 
          elevation={1}
          sx={{ 
            backgroundColor: 'var(--accent-red)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setSelectedBill(null)}
              sx={{ mr: 2 }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
              Bill #{selectedBill.id}
            </Typography>
            <Box sx={{ flexGrow: 1 }} />
            <IconButton
              color="inherit"
              onClick={() => handlePrint(selectedBill)}
              sx={{ 
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <PrintIcon />
            </IconButton>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ py: 4 }}>
          <Paper 
            elevation={2}
            sx={{ 
              p: { xs: 2, md: 4 }, 
              borderRadius: 3,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            {/* Bill Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar 
                sx={{ 
                  width: 80, 
                  height: 80, 
                  mx: 'auto', 
                  mb: 2,
                  backgroundColor: 'var(--accent-red)',
                }}
              >
                <ReceiptIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-primary)', mb: 1 }}>
                Restaurant Bill
              </Typography>
              <Typography variant="h6" sx={{ color: 'var(--text-secondary)' }}>
                Invoice #{selectedBill.id}
              </Typography>
            </Box>

            {/* Bill Information */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
                gap: 3, 
                mb: 3 
              }}>
                <Box>
                  <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                    Date & Time
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {formatDate(selectedBill.bill_time)}
                  </Typography>
                </Box>
                
                {selectedBill.name !== 'Unknown' && (
                  <Box>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                      Customer Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selectedBill.name}
                    </Typography>
                  </Box>
                )}
                
                {selectedBill.phone !== '0000000000' && (
                  <Box>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                      Phone Number
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selectedBill.phone}
                    </Typography>
                  </Box>
                )}
                
                {selectedBill.table_number && (
                  <Box>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
                      Table Number
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {selectedBill.table_number}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 3, borderColor: 'var(--border-color)' }} />

            {/* Bill Items */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)', mb: 3 }}>
                Order Items
              </Typography>
              
              {items.length === 0 ? (
                <Alert severity="warning" sx={{ borderRadius: 2 }}>
                  No order items found for this bill.
                </Alert>
              ) : (
                <TableContainer component={Paper} elevation={1} sx={{ 
                  borderRadius: 2,
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'var(--accent-red)' }}>
                        <TableCell sx={{ fontWeight: 600, color: 'white' }}>Item</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'white' }} align="center">Quantity</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: 'white' }} align="right">Total (₹)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.map((item, index) => (
                        <TableRow 
                          key={index} 
                          sx={{ 
                            '&:nth-of-type(odd)': { backgroundColor: 'var(--bg-secondary)' },
                            '&:hover': { backgroundColor: 'var(--hover-color)' }
                          }}
                        >
                          <TableCell sx={{ fontWeight: 500, color: 'var(--text-primary)' }}>{item.name}</TableCell>
                          <TableCell align="center" sx={{ color: 'var(--text-primary)' }}>{item.quantity}</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600, color: 'var(--accent-red)' }}>
                            ₹{item.total.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            <Divider sx={{ my: 3, borderColor: 'var(--border-color)' }} />

            {/* Total */}
            <Box sx={{ textAlign: 'right', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--accent-red)' }}>
                Total: ₹{total.toFixed(2)}
              </Typography>
            </Box>

            {/* Actions */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={() => handlePrint(selectedBill)}
                sx={{
                  borderRadius: 2,
                  fontWeight: 600,
                  backgroundColor: 'var(--accent-red)',
                  '&:hover': { backgroundColor: 'var(--accent-red-dark)' },
                  textTransform: 'none',
                  py: 1.5,
                }}
              >
                Print Bill
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleBackToMenu}
                startIcon={<CartIcon />}
                sx={{ 
                  borderRadius: 2, 
                  fontWeight: 600,
                  borderColor: 'var(--accent-red)',
                  color: 'var(--accent-red)',
                  '&:hover': { 
                    borderColor: 'var(--accent-red-dark)',
                    backgroundColor: 'var(--accent-red-light)'
                  },
                  textTransform: 'none',
                  py: 1.5,
                }}
              >
                Back to Menu
              </Button>
            </Stack>

            {/* Footer */}
            <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: '1px solid var(--border-color)' }}>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                Thank you for dining with us!
              </Typography>
              <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
                Please visit again
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      <AppBar 
        position="sticky" 
        elevation={1}
        sx={{ 
          backgroundColor: 'var(--accent-red)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        }}
      >
        <Toolbar>
          <ReceiptIcon sx={{ mr: 2, color: 'white' }} />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
            Bill Portal
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            color="inherit"
            onClick={handleBackToMenu}
            startIcon={<CartIcon />}
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
            }}
          >
            Back to Menu
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'var(--text-primary)' }}>
            📄 Your Bills
          </Typography>
          
          {(tableUniqueId || roomUniqueId) && bills.length > 0 && (
            <Button
              variant="contained"
              color="warning"
              onClick={async () => {
                try {
                  await apiService.clearTable(tableUniqueId || undefined, roomUniqueId || undefined);
                  alert('Table cleared successfully! All orders have been marked as billed.');
                  // Reload bills to reflect changes
                  loadBills();
                } catch (error: any) {
                  alert('Failed to clear table: ' + (error.response?.data?.error || error.message));
                }
              }}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                backgroundColor: '#ff9800',
                '&:hover': { backgroundColor: '#f57c00' },
                textTransform: 'none',
              }}
            >
              Clear Table
            </Button>
          )}
        </Box>

        {bills.length === 0 ? (
          <Paper 
            elevation={2}
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 3,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                mx: 'auto', 
                mb: 2,
                backgroundColor: '#ccc',
              }}
            >
              <ReceiptIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h6" sx={{ color: 'var(--text-secondary)', mb: 1 }}>
              No bills found
            </Typography>
            <Typography variant="body1" sx={{ color: 'var(--text-secondary)', mb: 3 }}>
              Bills will appear here after you place orders
            </Typography>
            <Button
              variant="contained"
              onClick={handleBackToMenu}
              startIcon={<CartIcon />}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                backgroundColor: 'var(--accent-red)',
                '&:hover': { backgroundColor: 'var(--accent-red-dark)' },
                textTransform: 'none',
              }}
            >
              Order Food
            </Button>
          </Paper>
        ) : (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              sm: 'repeat(2, 1fr)', 
              lg: 'repeat(3, 1fr)' 
            }, 
            gap: 3 
          }}>
            {bills.map((bill, index) => {
              const items = parseBillItems(bill.order_items);
              const total = items.reduce((sum, item) => sum + item.total, 0);
              
              return (
                <Card 
                  key={bill.id}
                  elevation={2}
                  sx={{ 
                    borderRadius: 3,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-secondary)',
                    '&:hover': { 
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                      borderColor: 'var(--accent-red)',
                    }
                  }}
                  onClick={() => setSelectedBill(bill)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        Bill #{bill.id}
                      </Typography>
                      <Chip 
                        label={`₹${total.toFixed(2)}`}
                        sx={{ 
                          backgroundColor: 'var(--accent-red)',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
                      {formatDate(bill.bill_time)}
                    </Typography>
                    
                    {bill.name !== 'Unknown' && (
                      <Typography variant="body2" sx={{ mb: 1, color: 'var(--text-primary)' }}>
                        <strong>Customer:</strong> {bill.name}
                      </Typography>
                    )}
                    
                    {bill.table_number && (
                      <Typography variant="body2" sx={{ mb: 2, color: 'var(--text-primary)' }}>
                        <strong>Table:</strong> {bill.table_number}
                      </Typography>
                    )}
                    
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
                      {items.length} item{items.length !== 1 ? 's' : ''}
                    </Typography>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBill(bill);
                      }}
                      sx={{ 
                        borderRadius: 2,
                        fontWeight: 600,
                        borderColor: 'var(--accent-red)',
                        color: 'var(--accent-red)',
                        '&:hover': {
                          borderColor: 'var(--accent-red-dark)',
                          backgroundColor: 'var(--accent-red-light)',
                        },
                        textTransform: 'none',
                      }}
                    >
                      View Details
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default BillPortal;
