var express = require('express');
const { response } = require('../app');
const objectId = require('mongodb').ObjectId
var router = express.Router();

var productHelpers = require('../helpers/product-helpers')
/* GET products */
router.get('/', function (req, res,next) {
  productHelpers.getAllProducts().then((products)=>{
    res.render('admin/admin', { admin: true,products });
  })
  
});
router.get('/add-products', function (req, res,next) {
  res.render('admin/add-product',{ admin: true});
});
router.post('/add-products', function (req, res,next) {


  productHelpers.addProduct(req.body, (id) => {
    let image = req.files.img
    console.log(req.body);
    image.mv('./public/product-images/'+id+'.jpg',(err, done)=>{
      if (!err) {
        res.render("admin/add-product")
      } else {
              console.log(err);
      }
    })

  })

});
//edit products
router.get('/edit-products/:id?',function(req,res,next) {
  id=req.query.id
  productHelpers.getProductDetails(id).then((product)=>{
    
  res.render('admin/edit-product',{admin:true,product});

  })
});
router.post('/edit-products',function(req,res){
  

  productHelpers.editProducts(req.body).then((response)=>{
   
    res.redirect('/admin')
    if(req.files.img!=null){
      let image = req.files.img //to get the photo submitted through form, in binary format.
    image.mv('./public/product-images/'+response+'.jpg');
    }
  })
  
})
///deleting products
router.post('/deleteProducts',function(req,res){
  productHelpers.deleteProduct(req.body.productId).then((response)=>{
    res.json(response)
  })
})
router.get('/view-users',function(req,res){
  productHelpers.viewUsers().then((users)=>{
    res.render('admin/view-users',{admin:true,users})
  })
})
router.get('/allOrders',(req,res)=>{
  productHelpers.getALlUsers().then((response)=>{
    res.render('admin/orderHistory',{response})
  })
})
// router.get('/view-users', function(req, res) {
//   res.render('admin/view-users');
// });

module.exports = router;
