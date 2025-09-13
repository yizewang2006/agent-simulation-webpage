package agents;

public class Heading 
{
	public int value = 0;
	public int value_next = 0;
	public int lowerRange = 0;
	public int upperRange = 0;
	public int property_ID = 0;
	public int interval = 10;
	//Pub is public or local
	//Public means property can be sense by other entity
	//Local means property can only be sensed by entity itself
	public boolean pub = true;
	//Glo is global or local
	//Global means sense not depend on FOV
	//Local means sense depends on FOV
	public boolean glo = false;
	
	public Heading()
	{
		
	}
	
	public Heading(int ID, int init_value, int lRange, int uRange, int value_interval, boolean p, boolean g)
	{
		this.property_ID = ID;
		this.value = init_value;
		this.lowerRange = lRange;
		this.upperRange = uRange;
		this.interval = value_interval;
		this.pub = p;
		this.glo = g;
	}


}
