/**
 * Pusat Konfigurasi IndoRepurpose AI
 * Semua data bisnis (Kontak, Rekening, Harga) diatur di sini.
 */

export const BUSINESS_CONFIG = {
  name: "IndoRepurpose AI",
  contact: {
    whatsapp: "628123456789", // Ganti dengan nomor Admin Anda
    email: "support@indorepurpose.ai",
  },
  payment: {
    methods: [
      { 
        id: 'gopay', 
        name: 'GoPay', 
        type: 'wallet', 
        logo: 'https://raw.githubusercontent.com/Zyknn/paymentlogo/main/Payment%20Channel/E-Wallet/Gopay.png',
        color: 'bg-blue-50', 
        account: '085728123219', 
        holder: 'BRAMASTYA FADHIL RINANTO' 
      },
      { 
        id: 'shopeepay', 
        name: 'ShopeePay', 
        type: 'wallet', 
        logo: 'https://raw.githubusercontent.com/Zyknn/paymentlogo/main/Payment%20Channel/E-Wallet/Shopee%20Pay.png',
        color: 'bg-orange-50', 
        account: '085728123219', 
        holder: 'BRAMASTYA FADHIL RINANTO' 
      },
      { 
        id: 'blu', 
        name: 'blu by BCA Digital', 
        type: 'bank', 
        logo: 'https://raw.githubusercontent.com/Zyknn/paymentlogo/main/Bank/Bank%20Logo/Blu%20BCA.png',
        color: 'bg-blue-50', 
        account: '005804673319', 
        holder: 'BRAMASTYA FADHIL RINANTO' 
      },
      { 
        id: 'jago', 
        name: 'Bank Jago', 
        type: 'bank', 
        logo: 'https://raw.githubusercontent.com/Zyknn/paymentlogo/main/Bank/Bank%20Logo/Jago.png',
        color: 'bg-orange-50', 
        account: '502328067481', 
        holder: 'BRAMASTYA FADHIL RINANTO' 
      },
      { 
        id: 'seabank', 
        name: 'SeaBank', 
        type: 'bank', 
        logo: 'https://raw.githubusercontent.com/Zyknn/paymentlogo/main/Bank/Bank%20Logo/SeaBank.png',
        color: 'bg-orange-50', 
        account: '901655806340', 
        holder: 'BRAMASTYA FADHIL RINANTO' 
      },
    ]
  }
};

/**
 * Fungsi pembantu untuk membuka WhatsApp dengan pesan otomatis
 */
export const openWhatsAppSupport = (data: { plan?: string, email?: string, orderId?: string, amount?: string }) => {
  const message = `Halo Admin ${BUSINESS_CONFIG.name}, saya ingin menanyakan status verifikasi paket *${data.plan || ''}* saya.%0A%0AEmail: ${data.email || ''}%0AID Transaksi: ${data.orderId || ''}%0ANominal: *Rp ${data.amount || ''}*`;
  window.open(`https://wa.me/${BUSINESS_CONFIG.contact.whatsapp}?text=${message}`, '_blank');
};
