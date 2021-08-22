
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="">
    <meta name="author" content="">

    <title>Renta Car De Exoneracion</title>

    <link href="<?php echo base_url().'assets/vendor/fontawesome-free/css/all.min.css'; ?>" rel="stylesheet" type="text/css">
    <link href="<?php echo base_url().'assets/css/nunito_fonts.css';  ?>" rel="stylesheet">
    <link href="<?php echo base_url().'assets/css/sb-admin-2.min.css'; ?>" rel="stylesheet">
    <link href="<?php echo base_url().'assets/'; ?>vendor/datatables/dataTables.bootstrap4.min.css" rel="stylesheet">
    <link rel='stylesheet' href='https://cdn.jsdelivr.net/npm/sweetalert2@10.10.1/dist/sweetalert2.min.css'>
    <link href="<?php echo base_url().'assets/'; ?>vendor/sweetalert/sweetalert.css" rel="stylesheet">

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0/jquery.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/sweetalert2@9.6.1/dist/sweetalert2.all.min.js"></script>
    <script src="<?php echo base_url().'assets/'; ?>vendor/jquery/jquery.min.js"></script>
    <script src="<?php echo base_url().'assets/'; ?>vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
    <script src="<?php echo base_url().'assets/'; ?>vendor/jquery-easing/jquery.easing.min.js"></script>
    <script src="<?php echo base_url().'assets/'; ?>js/sb-admin-2.min.js"></script>
    <script src="<?php echo base_url().'assets/'; ?>vendor/chart.js/Chart.min.js"></script>
    <script src="<?php echo base_url().'assets/'; ?>vendor/datatables/jquery.dataTables.min.js"></script>
    <script src="<?php echo base_url().'assets/'; ?>vendor/datatables/dataTables.bootstrap4.min.js"></script>
    <script src="<?php echo base_url().'assets/'; ?>vendor/sweetalert/sweetalert.min.js"></script>

</head>

<body id="page-top">

  <div id="wrapper">

    <ul class="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion" id="accordionSidebar">

      <a class="sidebar-brand d-flex align-items-center justify-content-center" href="<?php echo base_url().'admin'?>">
        <div class="sidebar-brand-icon rotate-n-15">
          <i class="fas fa-car"></i>
        </div>
        <div class="sidebar-brand-text mx-3">Renta Car Exoneracion</div>
      </a>

      <hr class="sidebar-divider my-0">

      <li class="nav-item active">
        <a class="nav-link" href="<?php echo base_url().'home'?>">
          <i class="fas fa-fw fa-tachometer-alt"></i>
          <span>Dashboard</span></a>
      </li>


      <hr class="sidebar-divider">

      <div class="sidebar-heading">
        Transacciones
      </div>

      <li class="nav-item">
        <a class="nav-link" href="<?php echo base_url().'home/car'?>"> <!-- it calls the functions that brings me the info from car table -->
          <i class="fas fa-fw fa-car"></i>
          <span>Gestion de Vehiculos</span>
        </a>
      </li>

      <li class="nav-item">
        <a class="nav-link" href="<?php echo base_url().'home/category'?>">
          <i class="fas fa-fw fa-truck"></i>
          <span>Gestion de Categorias de Vehiculos</span>
        </a>
      </li>

      <li class="nav-item">
        <a class="nav-link" href="<?php echo base_url().'home/brand'?>">
          <i class="fas fa-fw fa-building"></i>
          <span>Gestion de Marcas de Vehiculos</span>
        </a>
      </li>

      <li class="nav-item">
        <a class="nav-link" href="<?php echo base_url().'home/model'?>">
          <i class="fas fa-fw fa-industry"></i>
          <span>Gestion de Modelos de Vehiculos</span>
        </a>
      </li>

      <li class="nav-item">
        <a class="nav-link" href="<?php echo base_url().'home/customer'?>">
          <i class="fas fa-fw fa-user"></i>
          <span>Gestion de Cliente</span>
        </a>
      </li>

      <li class="nav-item">
        <a class="nav-link" href="<?php echo base_url().'home/employee' ?>">
          <i class="fas fa-fw fa-user"></i>
          <span>Gestion de Empleado</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="<?php echo base_url().'home/rentals' ?>">
          <i class="fas fa-fw fa-car"></i>
          <span>Renta de Vehiculos y Devoluciones</span>
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link" href="<?php echo base_url().'home/inspection' ?>">
          <i class="fas fa-fw fa-car"></i>
          <span>Inspeccion de Vehiculos</span>
        </a>
      </li>
      <li class="nav-item">
      <div class="dropdown-divider"></div>
        <a class="dropdown-item" href="<?php echo base_url().'logout'?>" data-toggle="modal" data-target="#logoutModal">
          <i class="fas fa-sign-out-alt fa-sm fa-fw mr-2 text-gray-400"></i>
          Logout
        </a>
      </li>
    </ul>

    <div id="content-wrapper" class="d-flex flex-column">

      <div id="content">
        <div class="container-fluid">
