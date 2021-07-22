<br>
<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Informacion de la Categoria</h1>
    <a href="<?php echo base_url().'home/add_category_act'; ?>" class="d-none d-sm-inline-block btn btn-sm btn-primary shadow-sm"><i class="fas fa-plus fa-sm text-white-50"></i> Agregar un Categoria</a>
</div>
    
<div class="card shadow mb-4">
    <div class="card-body">
        <div class="table-responsive">
            <table class="table table-bordered" id="dataTable" width="100%" cellspacing="0">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Tipo de Vehiculo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                <?php 
                foreach($car_category as $m){
                ?>
                    <tr>
                        <td><?php echo $m->cat_id ?></td>
                        <td><?php echo $m->cat_desc ?></td>
                        <td>
                        <?php
                        if($m->cat_status == 'A'){
                            echo 'Activo';
                        } else {
                            echo 'Inactivo';
                        }
                        ?>
                        </td>
                        <td>
                            <a class="btn btn-info btn-sm" href="<?php echo base_url().'home/edit_category/'.$m->cat_id; ?>">
                                <i class="fas fa-edit"></i> Editar
                            </a>
                            <a class="btn btn-danger btn-sm btn-delete" href="<?php echo base_url().'home/delete_category/'.$m->cat_id; ?>">
                                <i class="fas fa-trash"></i> Eliminar
                            </a>
                        </td>
                    </tr>
                <?php } ?>
                </tbody>
            </table>
        </div>
        <a href="<?php echo base_url().'home/add_car_act';?>" class="btn btn-danger">Cancelar</a>

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
        confirmButtonClass: "btn-delete",
        cancelButtonText: "No, cancelar!",
        closeOnConfirm: false,
        closeOnCancel: false
        },
        function(isConfirm) {
        if (isConfirm) {
            swal("¡Eliminado! "," Los datos de la categoria se han eliminado!", "success");
            setTimeout(function(){ 
                window.location.replace(url); 
            }, 2000);
        } else {
            swal("Cancelado", "Su informacion sigue a salvo :)", "error");
        }
        });
    });
</script>