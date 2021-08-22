<br>
<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Inspeccion de Rentas</h1>
    <a href="<?php echo base_url().'home/add_inspection'; ?>" class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm"><i class="fas fa-plus fa-sm text-white-50"></i>Hacer 
    nueva Inspeccion</a>
</div>
    
<div class="card shadow mb-4">
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-bordered" id="dataTable" width="100%" cellspacing="0">
                <thead>
                    <tr>
                        <th># Inspeccion</th>
                        <th>Vehiculo</th>
                        <th>Cliente</th>
                        <th>Tiene Ralladuras?</th>
                        <th>Nivel de Combustible</th>
                        <th>Tiene goma de repuesto?</th>
                        <th>Tiene gato?</th>
                        <th>Tiene roturas de cristal?</th>
                        <th>Estado de goma frontal derecha</th>
                        <th>Estado de goma frontal izquierda</th>
                        <th>Estado de goma trasera izquierda</th>
                        <th>Estado de goma trasera derecha</th>
                        <th>Etc</th>
                        <th>Fecha</th>
                        <th>Empleado</th>
                        <th>Estado</th>
                        <th>Aministrar</th>
                    </tr>
                </thead>
                <tbody>
                <?php 
                foreach($inspection as $m){
                ?>
                    <tr>
                        <td><?php echo $m->inspection_id ?></td>
                        <td><?php echo $m->car_desc ?></td>
                        <td><?php echo $m->customer_desc ?></td>
                        <td>
                        <?php
                        if($m->is_damaged == 'Y'){
                            echo 'Si';
                        } else {
                            echo 'No';
                        }
                        ?>
                        </td>
                        <td><?php echo $m->fuel_level ?></td>
                        <?php 
                        if($m->fuel_level == '1'){
                            echo '1/4';
                        }else if($m->fuel_level == '2'){
                            echo '1/2';
                        }else if($m->fuel_level == '3'){
                            echo '3/4';
                        }else{
                            echo 'Lleno';
                        }
                        
                        ?>
                        </td>
                        <td>
                        <?php
                        if($m->spare_tire == 'Y'){
                            echo 'Si';
                        } else {
                            echo 'No';
                        }
                        ?>
                        </td>
                        <td>
                        <?php
                        if($m->hydraulic_jack == 'Y'){
                            echo 'Si';
                        } else {
                            echo 'No';
                        }
                        ?>
                        </td>
                        <td>
                        <?php
                        if($m->windows_scratch == 'Y'){
                            echo 'Si';
                        } else {
                            echo 'No';
                        }
                        ?>
                        </td>
                        <td>
                        <?php
                        if($m->left_front_tire == 'B'){
                            echo 'Bien';
                        } else {
                            echo 'Deteriorada';
                        }
                        ?>
                        </td>
                        <td>
                        <?php
                        if($m->right_front_tire == 'B'){
                            echo 'Bien';
                        } else {
                            echo 'Deteriorada';
                        }
                        ?>
                        </td>
                        <td>
                        <?php
                        if($m->left_rear_tire == 'B'){
                            echo 'Bien';
                        } else {
                            echo 'Deteriorada';
                        }
                        ?>
                        </td>
                        <td>
                        <?php
                        if($m->right_rear_tire == 'B'){
                            echo 'Bien';
                        } else {
                            echo 'Deteriorada';
                        }
                        ?>
                        </td>
                        <td><?php echo $m->etc ?></td>
                        <td><?php echo $m->inspection_date ?></td>
                        <td><?php echo $m->employee_desc ?></td>
                        <td>
                        <?php
                        if($m->inspection_status == 'A'){
                            echo 'Activo';
                        } else {
                            echo 'Rechazada';
                        }
                        ?>
                        </td>
                        <td>
                            <a class="btn btn-info btn-edit" name="car_id" href="<?php echo base_url().'home/edit_inspection/'.$m->inspection_id; ?>">
                                <i class="fas fa-edit"></i> Editar
                            </a>
                            <a class="btn btn-danger btn-sm btn-delete" name="car_id" href="<?php echo base_url().'home/delete_inspection/'.$m->inspection_id; ?>">
                                <i class="fas fa-trash"></i> Eliminar
                            </a>
                        </td>
                    </tr>
                <?php } ?>
                </tbody>
            </table>
        </div>
        <a href="<?php echo base_url().'home/inspection';?>" class="btn btn-danger">Cancelar</a>
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