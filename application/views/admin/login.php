<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rent Car - Login</title>
    <link rel="preconnect" href="https://fonts.gstatic.com">
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="<?php echo base_url();?>assets/css/bootstrap.min.css">

    <script src="<?php echo base_url();?>assets/js/jquery.min.js"></script>
    <script src="<?php echo base_url();?>assets/js/popper.min.js"></script>
    <script src="<?php echo base_url();?>assets/js/bootstrap.min.js"></script>
    <script src="<?php echo base_url();?>assets/js/fontawesome.js"></script>

</head>
<body>   
    <div class="container" id="">
    <div class="modal-dialog" role="document">
        <div class="modal-content">
        <div class="modal-body">
            <div class="column-md-4" id="main">
                <h3>Rent-Car Exoneracion <i class="fas fa-car"></i></h3>
                <form method="post" action="<?php echo site_url('admin/login/verify')?>">
                    <div class="form-group">
                        <label for="exampleInputName">Nombre</label>
                        <input type="name" class="form-control" id="exampleInputName" placeholder="Nombre">
                    </div>
                    <div class="form-group">
                        <label for="exampleInputPassword1">Password</label>
                        <input type="password" class="form-control" id="exampleInputPassword1" placeholder="Password">
                    </div>
                    <button type="submit" class="btn btn-primary">Acceder</button>
                </form>
                <hr>
                <div>
                    <h6>Si no tienes una cuenta, creala aqui.</h6>
                </div>
                <div>
                    <input class="btn btn-primary" type="button" value="Registrate">
                </div>
            </div>
        </div>
        </div>
    </div>
    </div>
</body>
</html>