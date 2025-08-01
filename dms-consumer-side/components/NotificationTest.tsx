import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { connectSocket, joinRoom, onSocketEvent, offSocketEvent } from '../app/services/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NotificationTest = () => {
  const testLocalNotification = async () => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Test Local Notification',
          body: 'This is a test notification from DMS Mart!',
          data: { test: true },
        },
        trigger: null, // Send immediately
      });
      Alert.alert('Success', 'Test notification scheduled!');
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      Alert.alert('Error', 'Failed to schedule test notification');
    }
  };

  const testSocketConnection = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'No user ID found');
        return;
      }

      Alert.alert('Info', `User ID: ${userId}\nConnecting to socket...`);

      const socket = connectSocket();
      
      // Check if socket is connected
      if (socket.connected) {
        Alert.alert('Socket Status', 'Socket is already connected!');
        
        // Test basic socket functionality
        socket.on('connect', () => {
          Alert.alert('Socket Connect Event', 'Socket connect event fired!');
        });
        
        socket.on('disconnect', () => {
          Alert.alert('Socket Disconnect Event', 'Socket disconnect event fired!');
        });
        
      } else {
        Alert.alert('Socket Status', 'Socket is not connected. Waiting for connection...');
      }
      
      joinRoom(`user_${userId}`);
      
      // Test socket event with direct socket listener
      const testHandler = (data: any) => {
        Alert.alert('Socket Test Success!', `Received data: ${JSON.stringify(data)}`);
        socket?.off('test_event', testHandler);
      };
      
      // Set up the event listener directly on socket
      socket.on('test_event', testHandler);
      
      // Emit test event to self (echo test)
      socket.emit('test_event', { message: 'Test from client', timestamp: Date.now() });
      
      // Also test with a server echo
      socket.emit('echo', { message: 'Echo test', timestamp: Date.now() });
      
      // Test if we can receive our own emitted event
      setTimeout(() => {
        Alert.alert('Socket Test Result', 'If you didn\'t see a "Success" alert above, the socket event listeners are not working properly.');
      }, 2000);
      
    } catch (error) {
      console.error('Socket test error:', error);
      Alert.alert('Error', `Socket test failed: ${error}`);
    }
  };

  const testBackendNotification = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'No user ID found');
        return;
      }

      Alert.alert('Info', `Sending test notification to user: ${userId}`);

      const response = await fetch('https://dmsm-app-production-a35d.up.railway.app/api/users/test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title: 'Test Backend Notification',
          message: 'This is a test notification from the backend!'
        }),
      });

      const result = await response.json();
      Alert.alert('Backend Test', result.message || 'Test completed');
    } catch (error) {
      console.error('Backend test error:', error);
      Alert.alert('Error', `Backend test failed: ${error}`);
    }
  };

  const testOrderStatusUpdate = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert('Error', 'No user ID found');
        return;
      }

      Alert.alert('Order Update Test', 'Testing notification system...');
      
      // Test the socket event listener directly
      const socket = connectSocket();
      
      // Emit a test event that should trigger the notification
      socket.emit('order_status_update', {
        orderId: 'test-order-' + Date.now(),
        status: 'Processing',
        userId: userId
      });
      
      Alert.alert('Test Sent', 'Test event sent. You should see a notification if the socket system is working.');
      
    } catch (error) {
      console.error('Order status test error:', error);
      Alert.alert('Error', `Order status test failed: ${error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Test Panel</Text>
      
      <TouchableOpacity style={styles.button} onPress={testLocalNotification}>
        <Text style={styles.buttonText}>Test Local Notification</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testSocketConnection}>
        <Text style={styles.buttonText}>Test Socket Connection</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testBackendNotification}>
        <Text style={styles.buttonText}>Test Backend Notification</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={testOrderStatusUpdate}>
        <Text style={styles.buttonText}>Test Order Status Update</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={async () => {
        try {
          const userId = await AsyncStorage.getItem('userId');
          if (!userId) {
            Alert.alert('Error', 'No user ID found');
            return;
          }
          
          // Simulate order status update using local notification instead of backend
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Order Status Update',
              body: 'Your order #12345678 status has been updated to: Processing',
              data: { 
                type: 'order_status', 
                orderId: '12345678', 
                status: 'Processing',
                userId: userId 
              },
            },
            trigger: null,
          });
          
          Alert.alert('Success', 'Local order status update notification sent!');
        } catch (error) {
          Alert.alert('Error', `Test failed: ${error}`);
        }
      }}>
        <Text style={styles.buttonText}>Simulate Order Update (Local)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={async () => {
        console.log('=== SOCKET TEST STARTED ===');
        
        // Check userId first
        const userId = await AsyncStorage.getItem('userId');
        console.log('Current userId from AsyncStorage:', userId);
        
        // Test if socket event listener is working
        const socket = connectSocket();
        console.log('Socket connected:', socket.connected);
        console.log('Socket ID:', socket.id);
        
        // Test direct notification first
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Direct Test',
            body: 'Testing notification directly',
            data: { type: 'direct_test' },
          },
          trigger: null,
        });
        
        // Set up a test listener directly in this component
        const testListener = (data: any) => {
          console.log('[Test] Socket event received:', data);
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Socket Event Test',
              body: 'Socket event received in test component!',
              data: { type: 'socket_test' },
            },
            trigger: null,
          });
        };
        
        socket.on('test_event', testListener);
        
        // Then test socket event
        socket.emit('test_event', { message: 'Testing socket events', timestamp: Date.now() });
        Alert.alert('Socket Test', `Socket connected: ${socket.connected}. Direct notification sent. Socket event sent.`);
        
        // Clean up after 3 seconds
        setTimeout(() => {
          socket.off('test_event', testListener);
        }, 3000);
      }}>
        <Text style={styles.buttonText}>Test Socket Event Listener</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={async () => {
        try {
          const userId = await AsyncStorage.getItem('userId');
          if (!userId) {
            Alert.alert('Error', 'No user ID found');
            return;
          }
          
          // Test the backend notification endpoint directly
          const response = await fetch('https://dmsm-app-production-a35d.up.railway.app/api/users/test-notification', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              title: 'Test from Consumer App',
              message: 'This is a test notification from the consumer app!'
            }),
          });
          
          if (response.ok) {
            Alert.alert('Success', 'Test notification sent to backend!');
          } else {
            Alert.alert('Error', `Failed to send test notification: ${response.status}`);
          }
        } catch (error) {
          Alert.alert('Error', `Test failed: ${error}`);
        }
      }}>
        <Text style={styles.buttonText}>Test Backend Notification</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={async () => {
        try {
          const userId = await AsyncStorage.getItem('userId');
          if (!userId) {
            Alert.alert('Error', 'No user ID found');
            return;
          }
          
          // Manually trigger polling
          console.log('[Manual] Triggering order check...');
          const response = await fetch(`https://dmsm-app-production-a35d.up.railway.app/api/orders/user/${userId}`);
          
          if (response.ok) {
            const orders = await response.json();
            console.log('[Manual] Found orders:', orders.length);
            
            // Check for any orders and show their status
            if (orders.length > 0) {
              const orderStatuses = orders.map((order: any) => 
                `Order ${order.id.substring(0, 8)}: ${order.status}`
              ).join('\n');
              Alert.alert('Manual Check', `Found ${orders.length} orders:\n\n${orderStatuses}`);
            } else {
              Alert.alert('Manual Check', 'No orders found for this user.');
            }
          } else {
            Alert.alert('Error', `Failed to fetch orders: ${response.status}`);
          }
        } catch (error) {
          Alert.alert('Error', `Manual check failed: ${error}`);
        }
      }}>
        <Text style={styles.buttonText}>Manual Order Check</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={async () => {
        try {
          const userId = await AsyncStorage.getItem('userId');
          if (!userId) {
            Alert.alert('Error', 'No user ID found');
            return;
          }
          
          // Start manual polling
          console.log('[Manual Polling] Starting...');
          let pollCount = 0;
          
          const pollInterval = setInterval(async () => {
            pollCount++;
            console.log(`[Manual Polling] Check ${pollCount}...`);
            
            try {
              const response = await fetch(`https://dmsm-app-production-a35d.up.railway.app/api/orders/user/${userId}`);
              if (response.ok) {
                const orders = await response.json();
                console.log(`[Manual Polling] Found ${orders.length} orders`);
                
                // Check for status changes (simplified)
                orders.forEach((order: any) => {
                  console.log(`[Manual Polling] Order ${order.id.substring(0, 8)}: ${order.status}`);
                });
              }
            } catch (error) {
              console.log('[Manual Polling] Error:', error);
            }
            
            // Stop after 5 checks (50 seconds)
            if (pollCount >= 5) {
              clearInterval(pollInterval);
              console.log('[Manual Polling] Stopped after 5 checks');
              Alert.alert('Manual Polling', 'Polling completed. Check console for logs.');
            }
          }, 10000); // Check every 10 seconds
          
          Alert.alert('Manual Polling', 'Started polling every 10 seconds. Will check 5 times.');
        } catch (error) {
          Alert.alert('Error', `Manual polling failed: ${error}`);
        }
      }}>
        <Text style={styles.buttonText}>Start Manual Polling</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={() => {
        // Test the notification function directly
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Direct Test',
            body: 'Testing notification function directly',
            data: { type: 'direct_test' },
          },
          trigger: null,
        });
      }}>
        <Text style={styles.buttonText}>Test Notification Function</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={() => {
        // Test notification configuration
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Configuration Test',
            body: 'Testing notification configuration',
            data: { type: 'config_test' },
          },
          trigger: null,
        });
        Alert.alert('Test Sent', 'Configuration test notification sent. You should see a banner.');
      }}>
        <Text style={styles.buttonText}>Test Notification Config</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={async () => {
        // Debug: Check userId and socket status
        const userId = await AsyncStorage.getItem('userId');
        const socket = connectSocket();
        
        console.log('=== DEBUG INFO ===');
        console.log('userId from AsyncStorage:', userId);
        console.log('socket connected:', socket.connected);
        console.log('socket id:', socket.id);
        console.log('==================');
        
        // Test socket event listener
        const testListener = (data: any) => {
          console.log('[Debug] Socket event received:', data);
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Debug Socket Test',
              body: 'Socket event received in debug test!',
              data: { type: 'debug_test' },
            },
            trigger: null,
          });
        };
        
        // Test if we can receive our own emitted event
        socket.on('test_event', testListener);
        
        // Emit the event
        console.log('[Debug] Emitting test_event...');
        socket.emit('test_event', { message: 'Debug test', timestamp: Date.now() });
        
        // Also test with a different event name
        socket.on('debug_test', (data) => {
          console.log('[Debug] Debug test event received:', data);
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Debug Test 2',
              body: 'Second debug test received!',
              data: { type: 'debug_test_2' },
            },
            trigger: null,
          });
        });
        
        socket.emit('debug_test', { message: 'Second debug test', timestamp: Date.now() });
        
        Alert.alert('Debug Info', `userId: ${userId}\nsocket connected: ${socket.connected}\nsocket id: ${socket.id}\n\nTest event sent. Check for notification.`);
        
        // Clean up after 2 seconds
        setTimeout(() => {
          socket.off('test_event', testListener);
        }, 2000);
      }}>
        <Text style={styles.buttonText}>Debug Info</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={() => {
        // Test room joining
        const socket = connectSocket();
        const userId = AsyncStorage.getItem('userId').then(id => {
          if (id) {
            socket.emit('join', `user_${id}`);
            Alert.alert('Room Test', `Joining room: user_${id}`);
          }
        });
      }}>
        <Text style={styles.buttonText}>Test Room Joining</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default NotificationTest; 