<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Informacion del Empleado</h1>
    <a href="<?php echo base_url().'home/add_employee_act'; ?>" class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm"><i class="fas fa-plus fa-sm text-white-50"></i> Agregar Empleado</a>
</div>
    
<div class="card shadow mb-4">
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-bordered" id="dataTable" width="100%" cellspacing="0">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Nombre de Empleado</th>
                        <th>Numero de Cedula</th>
                        <th>Tanda Laboral</th>
                        <th>% de Comision</th>
                        <th>Fecha de Ingreso</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                <?php 
                foreach($employee as $k){
                ?>
                    <tr>
                        <td><?php echo $k->employee_id ?></td>
                        <td><?php echo $k->employee_name ?></td>
                        <td><?php echo $k->employee_cedula ?></td>
                        <td>
                        <?php 
                        if($k->employee_schedule == 'M'){
                            echo 'Matutina';
                        }else if($k->employee_schedule == 'V'){
                            echo 'Vespertina';
                        }else{
                            echo 'Nocturna';
                        }
                        
                        ?>
                        </td>
                        <td><?php echo $k->employee_commission ?></td>
                        <td><?php echo $k->employee_hiring_date ?></td>
                        <td>
                            <?php
                            if($k->employee_status == 'A'){
                                echo 'Activo';
                            } else {
                                echo 'Inactivo';
                            }
                            ?>
                        </td>
                        <td>
                            <a class="btn btn-info btn-edit" href="<?php echo base_url().'home/edit_employee/'.$k->employee_id; ?>">
                                <i class="fas fa-edit"></i> Editar
                            </a>
                            <a class="btn btn-danger btn-delete" href="<?php echo base_url().'home/delete_employee/'.$k->employee_id; ?>">
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
        swal("Borrada! "," Informacion del empleado borrada!", "success");
        setTimeout(function(){ 
            window.location.replace(url); 
        }, 2000);
      } else {
        swal("Cancelado "," Information del empleado aun a salvo.", "error");
      }
    });
});
</script>