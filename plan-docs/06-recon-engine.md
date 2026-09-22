evaluasi recon engine

REASONING: 
secara flow frontend udah benar pilih recon profile
make sure engin recon ini sesuai flow yaitu dari recon profile ini harusn recon ini harusnya baca source recon dahulu sesuai config misal DATABASE,FILE,FTP,SFTP dll sesuai config nya
dan gak cuma core dan partner untuk tipe nya 
masing2 source transform ke mapping field lalu dari situ bisa didapat status nya

karena saya lihat recon_execution_service.py ini belum sepenuh nya baca parameter recon profile, recon source dan recon mapping field masih ada yg code sesuai contoh saja

labih baik lagi di frontend  dan hasil export (xls,pdv,csv,txt) nya untuk list table detailnya dinamis sesuai mapping

misal 
profile BIFAST: 
- source : core,partner
- mapping: TRX_REFF(key),no rek send, no rek rcv,amount,tgl

profile: QRIS
- source : core, partner
- mapping : REFF(key),no rek,amount,merchant_name

pastikan aja flow nya sesuai itu
GET DB/GET FILE dari recon source


