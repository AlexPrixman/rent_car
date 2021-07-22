<br>
<div class="d-sm-flex align-items-center justify-content-between mb-4">
    <h1 class="h3 mb-0 text-gray-800">Editar Marca</h1>
</div>
    
<div class="card shadow mb-4">
    <div class="card-body">
        <?php foreach($car_brand as $m){ ?>
        <form action="<?php echo base_url().'home/update_category'?>" method="post">
            <input type="hidden" name="brand_id" value="<?php echo $m->brand_id; ?>">
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Descripcion</label>
                <div class="col-sm-10"><input type="text" class="form-control" name="brand_desc" value="<?php echo $m->brand_desc; ?>"></div>
            </div>
            <div class="form-group row">
                <label class="col-sm-2 col-form-label">Estado de la Marca</label>
                <div class="col-sm-2">
                    <select class="form-control" name="brand_status">
                        <option value="A">Activo</option>
                        <option value="I">Inactivo</option>
                    </select>
                </div>
            </div>
            <div class="form-group row">
                <div class="col-sm-10 offset-sm-2">
                    <button type="submit" class="btn btn-primary">Editar</button>
                    <a class="btn btn-danger" name="brand_id" href="<?php echo base_url().'home/brand'; ?>">Cancelar</a>
                </div>
            </div>
        </form>
        <?php } ?>
    </div>
</div>