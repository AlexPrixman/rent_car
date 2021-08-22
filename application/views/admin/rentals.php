<br>
<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Gestion de Rentas</h1>
    <a href="<?php echo base_url().'home/add_rental'; ?>" class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm"><i class="fas fa-plus fa-sm text-white-50"></i>Hacer 
    nueva Renta</a>
</div>
    
<div class="card shadow mb-4">
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-bordered" id="dataTable" width="100%" cellspacing="0">
                <thead>
                    <tr>
                        <th># Renta</th>
                        <th>Empleado</th>
                        <th>Fecha de la Renta</th>
                        <th># Vehiculo</th>
                        <th># Cliente</th>
                        <th>Duracion de la Renta</th>
                        <th>Fecha de Entrega</th>
                        <th>Cargo por Dia</th>
                        <th>Comentario</th>
                        <th>Estado de la Renta</th>
                        <th>Aministrar</th>
                    </tr>
                </thead>
                <tbody>
                <?php 
                foreach($rental as $m){
                ?>
                    <tr>
                        <td><?php echo $m->rental_id ?></td>
                        <td><?php echo $m->employee_desc ?></td>
                        <td><?php echo $m->rental_date ?></td>
                        <td><?php echo $m->car_desc ?></td>
                        <td><?php echo $m->customer_desc ?></td>
                        <td><?php echo $m->rental_time ?></td>
                        <td><?php echo $m->return_date ?></td>
                        <td><?php echo $m->fee_per_day ?></td>
                        <td><?php echo $m->comment ?></td>
                        <td>
                        <?php
                        if($m->rental_status == 'E'){
                            echo 'En Proceso';
                        } else {
                            echo 'Terminada';
                        }
                        ?>
                        </td>
                        <td>
                            <a class="btn btn-info btn-edit" name="car_id" href="<?php echo base_url().'home/edit_rental/'.$m->rental_id; ?>">
                                <i class="fas fa-edit"></i> Editar
                            </a>
                            <a class="btn btn-danger btn-sm btn-delete" name="car_id" href="<?php echo base_url().'home/delete_rental/'.$m->rental_id; ?>">
                                <i class="fas fa-trash"></i> Eliminar
                            </a>
                        </td>
                    </tr>
                <?php } ?>
                </tbody>
            </table>
        </div>
        <a href="<?php echo base_url().'home/rental';?>" class="btn btn-danger">Cancelar</a>
    </div>
</div>
<script type="text/javascript">
$('.btn-delete').on("click", function(e) {
  e.preventDefault();
  var url = $(this).attr('href');
  swal({
      title: "Seguro que desea eliminar la informacion?",
      text: "Recuerde que luego de borrarla no podra ser recuperada!",
      type: "warning",
      showCancelButton: true,
      confirmButtonColor: '#DD6B55',
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: "No, cancelar!",
      confirmButtonClass: "btn-danger",
      closeOnConfirm: false,
      closeOnCancel: false
    },
    function(isConfirm) {
      if (isConfirm) {
        swal("¡Eliminado! "," Los datos del automóvil se han eliminado!", "success");
        setTimeout(function(){ 
            window.location.replace(url); 
        }, 2000);
      } else {
        swal("Cancelado", "Su informacion sigue a salvo!", "error");
      }
    });
});
</script>