<br>
<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Informacion del Cliente</h1>
    <a href="<?php echo base_url().'home/add_customer_act'; ?>" class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm"><i class="fas fa-plus fa-sm text-white-50"></i> Agregar Cliente</a>
</div>
    
<div class="card shadow mb-4">
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-bordered" id="dataTable" width="100%" cellspacing="0">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Nombre de Cliente</th>
                        <th>Numero de Cedula</th>
                        <th>Tarjeta de Credito</th>
                        <th>Limite de Credito</th>
                        <th>Tipo de Persona</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                <?php 
                    foreach($customer as $k){
                ?>
                    <tr>
                        <td><?php echo $k->customer_id ?></td>
                        <td><?php echo $k->customer_name ?></td>
                        <td><?php echo $k->customer_cedula ?></td>
                        <td><?php echo $k->customer_cc ?></td>
                        <td><?php echo $k->customer_credit_limit ?></td>
                        <td>
                        <?php 
                        if($k->customer_type == 'F'){
                            echo 'Fiscal';
                        }else{
                            echo 'Juridica';
                        }  
                        ?>
                        </td>
                        <td>
                        <?php
                        if($k->customer_status == 'A'){
                            echo 'Activo';
                        } else {
                            echo 'Inactivo';
                        }
                        ?>
                        </td>
                        <td>
                            <a class="btn btn-info btn-sm" href="<?php echo base_url().'home/edit_customer/'.$k->customer_id; ?>">
                                <i class="fas fa-edit"></i> Editar
                            </a>
                            <a class="btn btn-danger btn-sm btn-delete" href="<?php echo base_url().'home/delete_customer/'.$k->customer_id; ?>">
                                <i class="fas fa-trash"></i> Borrar
                            </a>
                        </td>
                    </tr>
                <?php } ?>
                </tbody>
            </table>
        </div>
    </div>
</div>
<script type="text/javascript">
$('.btn-delete').on("click", function(e) {
  e.preventDefault();
  var url = $(this).attr('href');
  swal({
      title: "Seguro que deseas borrar la informacion?",
      text: "Recuerda que la informacion no puede ser recuperada despues de borrarla!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Si, borrar!',
      cancelButtonText: "No, cancelar!",
      confirmButtonClass: "btn-danger",
      closeOnConfirm: false,
      closeOnCancel: false
    },
    function(isConfirm) {
      if (isConfirm) {
        swal("Borrada! "," Informacion del cliente borrada!", "success");
        setTimeout(function(){ window.location.replace(url); 
        }, 2000);
      } else {
        swal("Canceled "," Information del cliente guardada. :)", "error");
      }
    });
});
</script>