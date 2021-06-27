<br>
<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Editar Categoria</h1>
</div>
    
<div class="card shadow mb-4">
    <div class="card-body">
        <?php foreach($car_category as $m){ ?>
        <form action="<?php echo base_url().'home/update_category'?>" method="post">
            <input type="hidden" name="cat_id" value="<?php echo $m->cat_id; ?>">
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Descripcion</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="cat_desc" value="<?php echo $m->cat_desc; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Estado</label>
                <div class="col-sm-2"><input type="text" class="form-control" name="cat_status" value="<?php echo $m->cat_status; ?>"></div>
            </div>
            <div class="form-group row">
                <div class="col-sm-10 offset-sm-2">
                    <button type="submit" class="btn btn-primary">Editar</button>
                    <a class="btn btn-danger" name="car_id" href="<?php echo base_url().'home/category'; ?>">Cancelar</a>
                </div>
            </div>
        </form>
        <?php } ?>
    </div>
</div>