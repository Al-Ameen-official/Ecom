db=require('../config/connection')
const { PRODUCT_COLLECTION, CART_COLLECTION } = require('../config/collections');
var collection=require('../config/collections')
const objectId = require('mongodb').ObjectId
const bcrypt=require('bcrypt');
const Razorpay = require('razorpay');
const { response } = require('../app');

let instance = new Razorpay({
    // key_id: process.env.RAZORPAY_KEY_ID,
    // key_secret: process.env.RAZORPAY_KEY_SECRET,
    key_id:'rzp_test_TvGWMBpENteAE2',
    key_secret:'tH4vJwFji3WLnDms9bT9sPyL'
  })
module.exports={
    doSignUp:(userData)=>{
        return new Promise(async (resolve, reject) => {
            userData.mainpass = await bcrypt.hash(userData.mainpass,10);
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{//iserting data into collection
            
              resolve(userData)
            })
        })
    },
    doLogin:(userData)=>{
        return new Promise(async(resolve, reject) => {
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({username:userData.username})
            
            if(user)
            { 
                bcrypt.compare(userData.password,user.mainpass).then((status)=>{
                    if(status){
                        response.user=user
                        response.status=true
                        resolve(response)
                    }
                else{
                    console.log("Login Failed!-wrong password");
                    resolve({status:false});
                }
                })
            }else{
                console.log("Login Failed!-wrong credential");
                    resolve({status:false});


            }

           
        })
        
    },
    addToCart:(productId,userId)=>{
        let productObject={
            item : objectId(productId),
            quantity:1
        }
        return new Promise(async (resolve, reject) => {

            let userCart=await db.get().collection(collection.CART_COLLECTION).findOne({'user':objectId(userId)})
            console.log(userCart)
            if(userCart)//checking if a cart already exxists for the user
            {
                let productCheck=userCart.products.findIndex(product=>product.item==productId)
                if(productCheck!=-1)//if the product already exists in the cart
                {
                    db.get().collection(collection.CART_COLLECTION).updateOne({'products.item':objectId(productId),'user':objectId(userId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }).then((response)=>{
                        resolve(response)
                    })
                }else{//if the product does'nt exist in the cart
                    db.get().collection(collection.CART_COLLECTION).updateOne({'user':objectId(userId)},
                    {
                        $push:{products:productObject}
                    }).then((response)=>{
                        resolve(response)
                    })
                }
            }else{
                let cartObj={
                    user : objectId(userId),
                    products:[productObject]

                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj)
                .then((response)=>{
                    resolve(response)
                })
            }

        })
    },
    getCartItems:(user)=>{
       
        let userId=user._id;
       
        return new Promise(async (resolve, reject) => {
            let cartProducts=await db.get().collection(CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },{
                    $unwind:'$products'
                },{
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                 },{
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:"item",
                        foreignField:'_id',
                        as:'productInfo'
                    }
                },
                    {
                        $project:{
                            item:1,
                            quantity:1,
                            product:{$arrayElemAt:['$productInfo',0]}


                        }
                    }
                
            ]).toArray()
           

            let cartCheck=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cartCheck){
                resolve(cartProducts)
            }else{
                resolve()
            }
        })
        
    },
    changeQuantityCount:(details)=>{
        return new Promise((resolve, reject) => {
           
            if(details.count==-1&&details.qty==1){
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},{
                    $pull:{products:{item:objectId(details.product)}}
                }).then((response)=>{
                    response.removeProduct=true
                    resolve(response)
                    
                })
            }
            else{
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},{
                    $inc:{'products.$.quantity':parseInt(details.count)}
                }).then((response)=>{
                    response.removeProduct=false
                    resolve(response)
                    
                })
            }
        })

    },
    deleteCartProduct:(details)=>{
        return new Promise((resolve,reject) => {
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cartId)},{
                $pull:{products:{item:objectId(details.productId)}}
            }
            ).then((response)=>{
                response.removed=true
                console.log(response);
                resolve(response)
            })
        })

    },
    getTotalCart:(userId)=>{
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{item:'$products.item',quantity:'$products.quantity'}
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'productInfo'

                    }
                },
                {
                    $project:{
                        item:1,quantity:1,product:{$arrayElemAt:['$productInfo',0]}
                    }
                },
                {
                    $project:{
                        quantity:1, price:{$toInt : '$product.price'}
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:{$multiply:['$quantity','$price']}}
                    }
                }
            ]).toArray()
            .then((response)=>{
                
                if(response[0]!=null){
                    resolve(response[0].total)
                }else{
                    resolve(0)
                }
               
            })
        })

    },
    getItemCount:(user)=>{
        return new Promise(async (resolve, reject) => {
            let count=0;
            let cart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(user)})
            if(cart){
                count=await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match:{user:objectId(user)}
                    },
                    {
                        $project:{
                            '_id':0,
                            'itemCount':{$sum:'$products.quantity'}
                        }
                    }
                ]).toArray()
                


            }
            if(count[0])
            {
                resolve(count[0].itemCount)
            }else{
                resolve(0)
            }
           
        })

    },
    placeOrder:(orderDetails,products,total)=>{
        return new Promise((resolve, reject) => {
            let status=orderDetails.paymentMethod=='cod'?'placed':'pending'//if orderDetails.paymentMethod equalto COD, then status is assigned string value 'placed'.
            let OrderObject={
                orderDetails:{
                    mobileNumber : orderDetails.phone,
                    address : orderDetails.address,
                    pincode : orderDetails.pincode
                },
                userId : objectId(orderDetails.userId),
                paymentMethod : orderDetails.paymentMethod,
                products : products,
                totalAmount : total,
                status : status,
                date: new Date().toLocaleString(undefined, {timeZone: 'Asia/Kolkata'})
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(OrderObject).then((response)=>{
                db.get().collection(collection.CART_COLLECTION).deleteOne({user:objectId(orderDetails.userId)}).then(()=>{
                    resolve({paymentMethod:orderDetails.paymentMethod,orderId:response.insertedId})
                })
            }) 
        })
        
    },
    getRazorPay : (orderId,totalAmount)=>{
       // console.log('helper-called.');
        return new Promise((resolve, reject)=>{
            instance.orders.create({
                amount: totalAmount+'00',
                currency: "INR",
                receipt: ""+orderId,
                
              }).then((response)=>{
                console.log("=======================");
                console.log(response)
                resolve(response)
              }).catch((err)=>{
                //console.log(err);
                reject(err)
              })
        })
    },
    verifyPayment : (details,RazorpayId)=>{
        return new Promise((resolve, reject)=>{
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET); // adding the name of algorithm and the secret key for hashing

            hmac.update(RazorpayId+'|'+details['payment[razorpay_payment_id]']) //data to be hashed
            hmac = hmac.digest('hex'); //converting the hashed product to hexacode string
            //check if the hmac generated here matches with the hexacode signature that razorpay sent back after successful payment.
            if(hmac === details['payment[razorpay_signature]']) {
                resolve()
            }else {
                reject()
            }
        })
    }
   

    
}