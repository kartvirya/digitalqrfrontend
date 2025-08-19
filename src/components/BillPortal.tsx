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

const BillPortal: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);

  const theme = useTheme();
  const [searchParams] = useSearchParams();
  
  const tableUniqueId = searchParams.get('table');
  const roomUniqueId = searchParams.get('room');

  useEffect(() => {
    loadBills();
  }, [tableUniqueId, roomUniqueId]);

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

  const parseBillItems = (items: Record<string, [number, string]>): BillItem[] => {
    try {
      return Object.entries(items).map(([name, data]) => ({
        name,
        quantity: data[0],
        total: parseInt(data[1])
      }));
    } catch {
      return [];
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .bill-info { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .total { font-weight: bold; font-size: 18px; text-align: right; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
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
                    <td>${item.total}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total">
              <strong>Total Amount: ₹${total}</strong>
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
          backgroundColor: '#f8f9fa',
        }}
      >
        <CircularProgress size={80} sx={{ color: '#d32f2f', mb: 3 }} />
        <Typography variant="h5" sx={{ color: '#333', fontWeight: 600, mb: 1 }}>
          Loading Bills...
        </Typography>
        <Typography variant="body1" sx={{ color: '#666' }}>
          Preparing your billing information
        </Typography>
      </Box>
    );
  }

  if (selectedBill) {
    const items = parseBillItems(selectedBill.order_items);
    const total = items.reduce((sum, item) => sum + item.total, 0);

    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
        <AppBar 
          position="sticky" 
          elevation={1}
          sx={{ 
            backgroundColor: '#d32f2f',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
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
              background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
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
                  backgroundColor: '#d32f2f',
                }}
              >
                <ReceiptIcon sx={{ fontSize: 40 }} />
              </Avatar>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#333', mb: 1 }}>
                Restaurant Bill
              </Typography>
              <Typography variant="h6" sx={{ color: '#666' }}>
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
                  <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                    Date & Time
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                    {formatDate(selectedBill.bill_time)}
                  </Typography>
                </Box>
                
                {selectedBill.name !== 'Unknown' && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      Customer Name
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                      {selectedBill.name}
                    </Typography>
                  </Box>
                )}
                
                {selectedBill.phone !== '0000000000' && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      Phone Number
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                      {selectedBill.phone}
                    </Typography>
                  </Box>
                )}
                
                {selectedBill.table_number && (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#666', mb: 1 }}>
                      Table Number
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: '#333' }}>
                      {selectedBill.table_number}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Bill Items */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#333', mb: 3 }}>
                Order Items
              </Typography>
              
              <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#333' }}>Item</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#333' }} align="center">Quantity</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#333' }} align="right">Total (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow 
                        key={index} 
                        sx={{ 
                          '&:nth-of-type(odd)': { backgroundColor: '#fafafa' },
                          '&:hover': { backgroundColor: '#f0f0f0' }
                        }}
                      >
                        <TableCell sx={{ fontWeight: 500, color: '#333' }}>{item.name}</TableCell>
                        <TableCell align="center">{item.quantity}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                          ₹{item.total}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Total */}
            <Box sx={{ textAlign: 'right', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#d32f2f' }}>
                Total: ₹{total}
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
                  backgroundColor: '#d32f2f',
                  '&:hover': { backgroundColor: '#b71c1c' },
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
                  borderColor: '#d32f2f',
                  color: '#d32f2f',
                  '&:hover': { 
                    borderColor: '#b71c1c',
                    backgroundColor: 'rgba(211, 47, 47, 0.1)'
                  },
                  textTransform: 'none',
                  py: 1.5,
                }}
              >
                Back to Menu
              </Button>
            </Stack>

            {/* Footer */}
            <Box sx={{ textAlign: 'center', mt: 4, pt: 3, borderTop: '1px solid #e0e0e0' }}>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Thank you for dining with us!
              </Typography>
              <Typography variant="body2" sx={{ color: '#666' }}>
                Please visit again
              </Typography>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <AppBar 
        position="sticky" 
        elevation={1}
        sx={{ 
          backgroundColor: '#d32f2f',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
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
          <Typography variant="h4" sx={{ fontWeight: 700, color: '#333' }}>
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
              background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
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
            <Typography variant="h6" sx={{ color: '#666', mb: 1 }}>
              No bills found
            </Typography>
            <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
              Bills will appear here after you place orders
            </Typography>
            <Button
              variant="contained"
              onClick={handleBackToMenu}
              startIcon={<CartIcon />}
              sx={{
                borderRadius: 2,
                fontWeight: 600,
                backgroundColor: '#d32f2f',
                '&:hover': { backgroundColor: '#b71c1c' },
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
                    border: '1px solid #e0e0e0',
                    '&:hover': { 
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                      borderColor: '#d32f2f',
                    }
                  }}
                  onClick={() => setSelectedBill(bill)}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#333' }}>
                        Bill #{bill.id}
                      </Typography>
                      <Chip 
                        label={`₹${total}`}
                        sx={{ 
                          backgroundColor: '#d32f2f',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
                      {formatDate(bill.bill_time)}
                    </Typography>
                    
                    {bill.name !== 'Unknown' && (
                      <Typography variant="body2" sx={{ mb: 1, color: '#333' }}>
                        <strong>Customer:</strong> {bill.name}
                      </Typography>
                    )}
                    
                    {bill.table_number && (
                      <Typography variant="body2" sx={{ mb: 2, color: '#333' }}>
                        <strong>Table:</strong> {bill.table_number}
                      </Typography>
                    )}
                    
                    <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
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
                        borderColor: '#d32f2f',
                        color: '#d32f2f',
                        '&:hover': {
                          borderColor: '#b71c1c',
                          backgroundColor: 'rgba(211, 47, 47, 0.1)',
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
