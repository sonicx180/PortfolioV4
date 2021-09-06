require("dotenv").config();
const express = require("express");
const path = require("path")
const hcaptcha = require('express-hcaptcha');
const bodyParser = require("body-parser")
const mongoose = require("mongoose")
const cookieParser = require("cookie-parser");
const cors = require('cors');
const fetch = require("superagent");
const nodemailer = require("nodemailer");
const Schema = mongoose.Schema;
const rateLimit = require("express-rate-limit");
const stripe = require("stripe")(process.env.STRIPE_SK);

const SubSchema = new Schema({
  email: { type: String, index: true, required: true },
});
const ProjectSchema = new Schema({
  title: { type: String, index: true },
  desc: { type: String, index: true },
  url: { type: String, index: true },
  imageURL: { type: String, index: true },
  category: { type: String, index: true }
});
const BlogPost = new Schema({
  title: { type: String, index: true },
  url: { type: String, index: true },
  imageURL: { type: String, index: true },
})
const Project = mongoose.model("Project", ProjectSchema);
const Sub = mongoose.model("Sub", SubSchema);
const Post = mongoose.model("Post", BlogPost)

function sendEmail(to, subject, message) {
  let mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'conner.ow.dev@gmail.com',
      pass: process.env.GP
    }
  });

  let mailDetails = {
    from: 'conner.ow.dev@gmail.com',
    to: 'connerow1115@gmail.com, '+to,
    subject: subject,
    text: message
  };

  mailTransporter.sendMail(mailDetails, function(err, data) {
    if (err) console.error(err)
  });
}

const app = express();
const SECRET = process.env.HC_SECRET;

mongoose.connect(process.env.MONGO_URI);
app.use(cors());
app.set('json spaces', 2);
app.use(cookieParser());
app.use(bodyParser.json({ limit: '200mb' }))
app.use(bodyParser.json({ limit: "200mb" }));
app.use(bodyParser.urlencoded({ limit: "200mb", extended: true, parameterLimit: 1000000 }));
const apiLimiter = rateLimit({
  windowMs: 1000 * 3600 * 24, // 15 minutes
  max: 1,
});
app.use("/subscribe", apiLimiter);
app.use("/em-hire", apiLimiter);

function renderFile(file){
  return (req, res) => res.sendFile(path.join(__dirname, "/templates/"+file))
}

app.get("/", renderFile("index.html"));
app.get("/blog", renderFile("blog.html"));
app.get("/about", renderFile("about.html"));
app.get("/work", renderFile("work.html"));
app.get("/contact", renderFile("contact.html"));
app.get("/hire", renderFile("hire.html"));
app.get("/hired", renderFile("hired.html"));
app.get("/proto-admin-1115", renderFile("admin.html"));
app.get("/subscribed", renderFile("sub.html"))
app.get("/pay/basic", renderFile("paybasic.html"))
app.get("/pay/standard", renderFile("paystandard.html"))
app.get("/pay/premium", renderFile("paypremium.html"))
app.get("/pay/super", renderFile("paysuper.html"))
app.get("/cancel", renderFile("cancel.html"))
app.get("/success", renderFile("success.html"))
app.get("/files/:file", (req, res) => {
  res.sendFile(path.join(__dirname, "/static/"+req.params.file))
})

app.get("/api/projects", async (req, res) => {
  let data = await Project.find({__v: 0});
  res.send(data);
})
app.get("/api/posts", async (req, res) => {
  let data = await Post.find({__v: 0});
  res.send(data);
})
app.get("/api/emails", async (req, res) => {
  if(req.cookies.cookie==decodeURIComponent(process.env.admin_session)){
    let data = await Sub.find({__v: 0});
    res.send(data);
  }else{
    res.status(401).send("Unauthorized")
  }
})

app.post("/add-project", async (req, res) => {
  if(req.body.password == process.env.admin_password && req.cookies.cookie == decodeURIComponent(process.env.admin_session)){
    let proj = new Project({
      title: req.body.title,
      desc: req.body.description,
      url: req.body.url,
      imageURL: req.body['i-url'],
      category: req.body.category
    });
    proj.save((e, d) => {
      if(e)console.error(e);
      else res.status(200).redirect("/proto-admin-1115")
    })
  }else{
    res.send({ error: "Unauthorized Request", success: false })
  }
})
app.post("/del-project", async (req, res) => {
  if(req.body.password == process.env.admin_password && req.cookies.cookie == decodeURIComponent(process.env.admin_session)){
    Project.remove({_id: req.body.projid }, (e, d) => {
      if(e)console.error(e);
      else{
        res.status(200).redirect("/proto-admin-1115");
      }
    });
  }else{
    res.send({ error: "Unauthorized Request", success: false })
  }
})
app.post("/edit-project", async (req, res) => {
  if(req.body.password == process.env.admin_password && req.cookies.cookie == decodeURIComponent(process.env.admin_session)){
    Project.findOne({_id: req.body.projid}, (e, d) => {
      if(e)console.error(e);
      else{
        d.title = req.body.title;
        d.desc = req.body.description;
        d.imageURL = req.body['i-url'];
        d.save((e, D) => {
      if(e)console.error(e);
      else res.status(200).redirect("/proto-admin-1115")
    })
      }
    });
  }else{
    res.send({ error: "Unauthorized Request", success: false })
  }
})


app.post("/del-sub", async (req, res) => {
  if(req.body.password == process.env.admin_password && req.cookies.cookie == decodeURIComponent(process.env.admin_session)){
  Sub.findOne({ email: req.body.email }, (e, d) => {
    if(e)console.error(e);
    else{
      if(d){
        Sub.remove({ email: req.body.email }, (er, r) => {
          if(er)console.error(er);
          else{
            res.status(200).redirect("/proto-admin-1115")
          }
        });
      }else{
        res.status(404).json({ error: "User not found", success: false })
      }
    }
  })
  }else{
    res.send({ error: "Unauthorized Request", success: false })
  }
})
app.post("/message-sub", async (req, res) => {
  if(req.body.password == process.env.admin_password && req.cookies.cookie == decodeURIComponent(process.env.admin_session)){
  let subs = await Sub.find({__v: 0});
  for(var i in subs){
    sendEmail(subs[i].email, req.body.title, req.body.cont)
  }
  res.status(200).redirect("/proto-admin-1115")
  }else{
    res.send({ error: "Unauthorized Request", success: false })
  }
})
app.post("/edit-blogpost", async (req, res) => {
  if(req.body.password == process.env.admin_password && req.cookies.cookie == decodeURIComponent(process.env.admin_session)){
    Post.findOne({_id: req.body.postid}, (e, d) => {
      if(e)console.error(e);
      else{
        d.title = req.body.title;
        d.url = req.body.url;
        d.imageURL = req.body['i-url'];
        d.save((e, D) => {
      if(e)console.error(e);
      else res.status(200).redirect("/proto-admin-1115")
    })
      }
    });
  }else{
    res.send({ error: "Unauthorized Request", success: false })
  }
})
app.post("/del-blogpost", async (req, res) => {
  if(req.body.password == process.env.admin_password && req.cookies.cookie == decodeURIComponent(process.env.admin_session)){
    Post.remove({_id: req.body.postid }, (e, d) => {
      if(e)console.error(e);
      else{
        res.status(200).redirect("/proto-admin-1115");
      }
    });
  }else{
    res.send({ error: "Unauthorized Request", success: false })
  }
})
app.post("/add-blogpost", async (req, res) => {
  if(req.body.password == process.env.admin_password && req.cookies.cookie == decodeURIComponent(process.env.admin_session)){
    let post = new Post({
      title: req.body.title,
      imageURL: req.body['i-url'],
      url: req.body.url
    });
    post.save((e, d) => {
      if(e)console.error(e);
      else res.status(200).redirect("/proto-admin-1115")
    })
  }else{
    res.send({ error: "Unauthorized Request", success: false })
  }
})
app.post("/subscribe", async (request, res) => {
  let data = await fetch.get("https://hcaptcha.com/siteverify?response="+request.body['h-captcha-response']+"&secret="+SECRET);
  if(data.body.success){
    let subscriber = new Sub({
      email: request.body.email
    });
    subscriber.save((err, data) => {
      if(err) { console.error(err); }
      else{
        sendEmail(request.body.email, "Thank you for subscribing!", "Hello, this is Conner/LeviathanProgramming.  Thank you for subscribing to me!  Stay tuned for future blog posts and new projects!\n\nIf at any time you think these emails aren't worth your time, simply respond to it and I will remove you.  Thanks once again!")
        res.redirect("/subscribed")
      }
    });
  }else{
    res.json({ error: "Unauthorized - Suspected bot request", success: false })
  }
})
app.post("/em-hire", async (request, res) => {
  let data = await fetch.get("https://hcaptcha.com/siteverify?response="+request.body['h-captcha-response']+"&secret="+SECRET);
  if(data.body.success){
    let form = request.body
    sendEmail(form.email, "Resouces needed for your website", `
    Hello, ${form.name}, thank you for assigning this task to me!
    I will let you know when I start building your site, but before anything else, please give me the info I need, written below.

    Now before I ask you of anything, I just want to let you know that there is a waitlist of people and that you will have to wait your turn before I start working on your website.

    That being said, please give me the following info:
    1. Depending on the plan you chose and how many pages you want, please describe each page to me.  An example website should have a Homepage, About page, Contact page, etc.  Please give me a detailed description of each individual page.

    2. Please provide me with any images, text, and other assets that you want in your website.  Simply send them to me through email.

    3. Please purchase a domain name of your own.  I will help you set up the domain as well as deploying your project.

    I will charge you after I finish making your website by sending you a link to an online payment form.
    Thank you once again.  Have a great week.

    ----
    Just a quick overview of what you requested:
    plan: ${form.plan}
    Website Type: ${form.type}
    Extra Info: ${form.message}
    ----
    `)
    res.redirect("/hired")
  }else{
    res.json({ error: "Unauthorized - Suspected bot request", success: false })
  }
})
app.post("/payment", async (req, res) => {
    const { product } = req.body;
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: product.name,
                        //images: [product.image],
                    },
                    unit_amount: product.amount * 100,
                },
                quantity: product.quantity,
            },
        ],
        mode: "payment",
        success_url: `https://${req.headers.host}/success`,
        cancel_url: `https://${req.headers.host}/cancel`,
    });

    res.json({ id: session.id });
});

app.get("*", renderFile("404.html"))
app.listen(3000, () => console.log("Listening on port 3000"))