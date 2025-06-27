// Simulated WhatsApp notification service
export const sendWhatsAppNotification = async (
  phoneNumber: string,
  patientName: string,
  vaccineName: string,
  doctorName: string
): Promise<boolean> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const message = `🏥 Vaccination Update for ${patientName}
  
${vaccineName} vaccination has been updated by ${doctorName}.

📅 Please check your vaccination record for details.
  
Thank you for keeping your child's vaccinations up to date! 💚`;

  console.log(`WhatsApp notification sent to ${phoneNumber}:`, message);
  
  // Simulate notification in the UI
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Vaccination Record Updated', {
      body: `${vaccineName} vaccination updated for ${patientName}`,
      icon: '/vaccination-icon.png'
    });
  }
  
  return true;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
};