var express = require('express');
const { response } = require('../app');
const productHelpers = require('../helpers/product-helpers');
const userHelpers = require('../helpers/user-helpers');
const { param } = require('./admin');
var router = express.Router();

const verifyLogin = (req,res,next)=>{
  if(req.session.loggedIn) {
    next();
  }else {
    res.redirect('/login');
  }
}
//paypal
const paypal = require('paypal-rest-sdk');
paypal.configure({
  'mode': 'sandbox', //sandbox or live
  'client_id': '####yourclientid######',
  'client_secret': '####yourclientsecret#####'
});
/* GET home page. */
router.get('/', async function (req, res, next) {
  let user=req.session.user
  let loggedIn=req.session.loggedIn
  
  if(loggedIn)
  { let cartProductCount=await userHelpers.getItemCount(user._id)
    res.render('user/index', { admin: false,user,cartProductCount });
  }else{
    res.render('user/index', { admin: false });
  }
  
});
//products-page where all products are listed
router.get('/view-products',verifyLogin, function (req, res, next) {
  productHelpers.getAllProducts().then(async (products) => {
  
    let user=req.session.user
    let cartProductCount=await userHelpers.getItemCount(user._id)
    res.render('user/view-products', { admin: false, products,user,cartProductCount });

  })
  // res.render('user/view-products', { admin: false });
});

//product -page of individual product which has add to cart option

router.get('/product-page/:id?',verifyLogin, function (req, res, next) {
  id = req.query.id

  const user=req.session.user
  
  productHelpers.getProductDetails(id).then((product) => {
    
    res.render('user/product-page', { admin: false, product ,user});
  })
  ///post
router.get('/addToCart/:id?',function(req,res){
  proId=req.query.id
    userHelpers.addToCart(proId,req.session.user._id).then((response)=>{
    res.json({status:true})
    
  })

})  

});
//route-login page
router.get('/login',function (req, res,next) {
  if(req.session.loggedIn==true)
  {
    res.redirect('/')
  }
  else{
    res.render('user/login')
  }
 
})
router.post('/login', function (req, res) {
  userHelpers.doLogin(req.body).then((response) => {
    if (response.status === true) {
      req.session.loggedIn = true
      req.session.user = response.user
      
      res.redirect('/')
    }
    else {
      res.redirect('/login')
      res.session.loginError='invalid login credentials'
      console.log("error login")
    }
  })
})
//route-signup page
router.get('/signup', function (req, res) {
  res.render('user/signup')
})
//route-handling data from signup
router.post('/signup', function (req, res) {
  console.log(req.body);
  userHelpers.doSignUp(req.body).then((response) => {
     if(req.files.img!=null){
      let image = req.files.img //to get the photo submitted through form, in binary format.
    image.mv('./public/user-images/'+response+'.jpg');
    }
    res.redirect('/login')
  })

})
// logout---------
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/')
})
//cart----------
router.get('/cart',verifyLogin,async (req,res)=>{
  const user=req.session.user
  
  
  let products=await userHelpers.getCartItems(req.session.user)
  
  let total=await userHelpers.getTotalCart(user._id)
  if(total){

  }else{
    total='CART IS EMPTY'
  }
  //console.log(total)
  res.render('user/cart',{products,user,total})
})
///post-add to cart
////changing count in the cart page
router.post('/changeProductCount',function(req,res){
  userHelpers.changeQuantityCount(req.body).then(async (response)=>{
    
   response.total=await userHelpers.getTotalCart(req.body.user) 
   
    res.json(response)
  })
 
  
})
////deleting product in the cart
router.post('/deleteCartProducts',async function(req,res){
  
   userHelpers.deleteCartProduct(req.body).then( (response)=>{
    
    
    res.json(response)
   })
})
////checkout page
router.get('/checkout',verifyLogin,async function(req,res){
const user = req.session.user;  
let total=await userHelpers.getTotalCart(user._id)  

res.render('user/checkout',{admin:false,total,user})
})
////placing order,
router.post('/checkout',async (req,res)=>{
  let userId=req.body.userId
  let user={
    _id:userId
  }
  let products=await userHelpers.getCartItems(user)
  let total=await userHelpers.getTotalCart(req.body.userId)
  userHelpers.placeOrder(req.body,products,total).then((responseAfterOrder)=>{
   
   
    if(responseAfterOrder.paymentMethod==='cod'){
      orderId=responseAfterOrder.orderId;
      let resp={codPayment:true}
      res.json(resp)
    }else if(responseAfterOrder.paymentMethod==='online'){
      userHelpers.getRazorPay(responseAfterOrder.orderId,total).then((response)=>{
        RayzerPayId=response.id
        console.log("===========")
        console.log(response);
        res.json(response)
        
      })
    }else{
      res.send('Error aayi')
    }
  })

  
})
////verify payment
router.post('/verify-payment',(req,res)=>{
  //console.log(req.body);
  userHelpers.verifyPayment(req.body,RazorpayId).then(()=>{

    OrderId = (req.body['order[receipt]']); //for insertion in success payment page
    RazorpayId = null; //resetting global value
    //console.log('receipt number : '+req.body['order[receipt]']);
    //if payment is verified successfully, we have to change the status of the order placed as success.
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then((response)=>{
      res.json({status:true})
    })
    .catch((err)=>{
      res.json({status:false,errMsg:'Payment Failed'})
    })
  })
})
///user profile
router.get('/user-details',verifyLogin,async (req,res)=>{
  let userId=req.session.user
 
  let user=await userHelpers.getUser(userId._id)
  
  
  res.render('user/userDetails',{admin:false,user})
})
///editing user
router.get('/edit-user',verifyLogin,async(req,res)=>{
  let userId=req.session.user
  let user=await userHelpers.getUser(userId._id)
  res.render('user/editUser',{admin:false,user})
})
router.post('/edit-user',(req,res)=>{
  
  userHelpers.editUser(req.body).then((response)=>{
    res.json(response)
  })
})
///////////////order history
router.get('/orders',verifyLogin,(req,res)=>{
  let userId=req.session.user
  
  userHelpers.getOrders(userId._id).then((orders)=>{
  
    res.render('user/orders',{orders})
   
  })
 
})
router.get('/order-history',(req,res)=>{
  res.render('user/orderDetails')
})
module.exports = router;
