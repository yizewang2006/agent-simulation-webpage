package entities;

public class Entity
{
	public double ID;
	public boolean warp = false;
	public boolean modify = false;
	public boolean sense = false;
	//This distance is used to sort entity base on this entity distance to a target agent.
	public double distance = 0;
	public boolean remove = false;
	
	public Entity (double t)
	{
		this.ID = t;
	}
	
}
