import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  IconButton,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem as MuiMenuItem,
  Chip,
  CardMedia,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api';
import { MenuItem as MenuItemType } from '../types';

const MenuManagement: React.FC = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemType | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    description: '',
    price: '0',
    is_available: true,
  });

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      const data = await apiService.getMenuItems();
      setMenuItems(data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateItem = async () => {
    try {
      await apiService.createMenuItem(newItem);
      setSuccess('Menu item created successfully');
      setOpenDialog(false);
      setNewItem({
        name: '',
        category: '',
        description: '',
        price: '0',
        is_available: true,
      });
      loadMenuItems();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to create menu item');
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;
    try {
      await apiService.updateMenuItem(editingItem.id, editingItem);
      setSuccess('Menu item updated successfully');
      setOpenDialog(false);
      setEditingItem(null);
      loadMenuItems();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to update menu item');
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (window.confirm('Are you sure you want to delete this menu item?')) {
      try {
        await apiService.deleteMenuItem(itemId);
        setSuccess('Menu item deleted successfully');
        loadMenuItems();
      } catch (error: any) {
        setError(error.response?.data?.error || 'Failed to delete menu item');
      }
    }
  };

  const handleEditItem = (item: MenuItemType) => {
    setEditingItem(item);
    setOpenDialog(true);
  };

  const handleOpenCreateDialog = () => {
    setEditingItem(null);
    setOpenDialog(true);
  };

  if (!user?.is_superuser && !user?.cafe_manager) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" color="error">
          Access Denied
        </Typography>
        <Typography variant="body1">
          You don't have permission to access menu management.
        </Typography>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" sx={{ mb: 3 }}>
        Menu Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Menu Items</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenCreateDialog}
        >
          ADD MENU ITEM
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
        {menuItems.map((item) => (
          <Card key={item.id}>
            {item.image_url && (
              <CardMedia
                component="img"
                height="200"
                image={item.image_url}
                alt={item.name}
                sx={{ objectFit: 'cover' }}
              />
            )}
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {item.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {item.description}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Category:</strong> {item.category}
              </Typography>
              <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                ₹{item.price}
              </Typography>
              <Chip
                label={item.is_available ? 'Available' : 'Unavailable'}
                color={item.is_available ? 'success' : 'error'}
                size="small"
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => handleEditItem(item)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDeleteItem(item.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={editingItem ? editingItem.name : newItem.name}
              onChange={(e) => {
                if (editingItem) {
                  setEditingItem({ ...editingItem, name: e.target.value });
                } else {
                  setNewItem({ ...newItem, name: e.target.value });
                }
              }}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Category"
              value={editingItem ? editingItem.category : newItem.category}
              onChange={(e) => {
                if (editingItem) {
                  setEditingItem({ ...editingItem, category: e.target.value });
                } else {
                  setNewItem({ ...newItem, category: e.target.value });
                }
              }}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={editingItem ? editingItem.description : newItem.description}
              onChange={(e) => {
                if (editingItem) {
                  setEditingItem({ ...editingItem, description: e.target.value });
                } else {
                  setNewItem({ ...newItem, description: e.target.value });
                }
              }}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Price"
              type="number"
              value={editingItem ? editingItem.price : newItem.price}
              onChange={(e) => {
                if (editingItem) {
                  setEditingItem({ ...editingItem, price: e.target.value });
                } else {
                  setNewItem({ ...newItem, price: e.target.value });
                }
              }}
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Availability</InputLabel>
              <Select
                value={editingItem ? editingItem.is_available.toString() : newItem.is_available.toString()}
                onChange={(e) => {
                  if (editingItem) {
                    setEditingItem({ ...editingItem, is_available: e.target.value === 'true' });
                  } else {
                    setNewItem({ ...newItem, is_available: e.target.value === 'true' });
                  }
                }}
                label="Availability"
              >
                <MuiMenuItem value="true">Available</MuiMenuItem>
                <MuiMenuItem value="false">Unavailable</MuiMenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={editingItem ? handleUpdateItem : handleCreateItem}
            variant="contained"
          >
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MenuManagement;
