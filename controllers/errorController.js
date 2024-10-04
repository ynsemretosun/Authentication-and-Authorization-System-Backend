const AppError = require('./../utils/appError');

// Geçersiz JWT hatasının yakalanması
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

// JWT'nin süresinin dolmuş olması durumunda hatanın yakalanması
const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// MongoDB'den dönen veri tipi hatalarının yakalanması
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

// MongoDB'de duplicate field hatasının yakalanması
const handleDuplicateFieldsDB = (err) => {
  const message = `Duplicate field value: ${err.keyValue.name}. Please use another value!`;
  return new AppError(message, 400);
};

// MongoDB'de doğrulama hatasının yakalanması
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Geliştirme ortamında hata mesajlarının gönderilmesi
const sendErrorDev = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
  }
};

// Yayınlanmış projede hata mesajlarının gönderilmesi
const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // İşlemsel hataların kullanıcıya gösterilmesi
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }

    // Programlama veya diğer bilinmeyen hataların kullanıcıya gösterilmesi
    console.error('ERROR 💥', err);
    return res.status(500).json({
      status: 'error',
      message: 'Something went very wrong!',
    });
  }

  // İşlemsel hataların kullanıcıya gösterilmesi
  if (err.isOperational) {
    return res.status(err.statusCode).json('error', {
      title: 'Something went wrong!',
      message: err.message,
    });
  }

  // Programlama veya diğer bilinmeyen hataların kullanıcıya gösterilmesi
  console.error('ERROR 💥', err);
  return res.status(err.statusCode).json('error', {
    title: 'Something went wrong!',
    message: 'Please try again later.',
  });
};

module.exports = (err, req, res, next) => {
  // Hata kodu ve mesajı tanımlanması
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  // Geliştirme ve yayın ortamlarına göre hata mesajlarının gösterilmesi

  if (process.env.NODE_ENV === 'development') {
    // Geliştirme ortamı
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Yayın ortamı
    let error = { ...err };
    if (error.name === 'CastError')
      // MongoDB'den dönen veri tipi hatasının yakalanması
      error = handleCastErrorDB({
        path: err.path,
        value: err.value,
        name: err.name,
      });
    // Dönen hata tiplerine göre gerekli fonksiyonların çağrılması
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, req, res);
  }
};
